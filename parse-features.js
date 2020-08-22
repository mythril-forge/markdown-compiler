
// Without generating new objects, this function can filter each class feature.
// For example, it knows that "channel divinity" works for both "cleric" and "paladin".
const getClassFeatures = (features) => {
	features = Object.entries(features)

	// Fill in classFeatures to get some nice fat data.
	let classFeatures = {}
	for (const [featureName, featureData] of features) {
		if ('classes' in featureData) {

			// Loop through each feature's classes for each feature.
			const classNames = Object.keys(featureData.classes)
			for (const className of classNames) {
				// Add new classes to the classFeatures object.
				if (!(className in classFeatures)) {
					classFeatures[className] = {}
				}
				// Add new features to the classFeatures object.
				if (!(featureName in classFeatures[className])) {
					classFeatures[className][featureName] = {}
				}
				// Add associated data.
				classFeatures[className][featureName] = featureData
			}
		}
	}
	// Return compiled object.
	return classFeatures
}

const getClassProgression = (
	classFeatures,
	classes = undefined,
) => {
	const getOne = (className) => {
		// Initialize empty array to hold class progression rows.
		// Each row will have a distinct level.
		// ---
		// An object or dictionary could have been used, but this will be ported to JSON.
		// JSON doesn't support integer keys. I don't like that.
		const progression = []
		let maxLevel = 20
		if (classes !== undefined) {
			if (classFeatures.includes(className)) {
				maxLevel = classes[className]['max-level']
			}
		}
		for (let level in [...Array(maxLevel).keys()]) {
			level = parseInt(level) + 1
			progression.push({
				Level: level,
				Features: [],
			})
		}

		// Create an array of class features, sorted alphabetically by name.
		const sortedFeatures = Object.values(classFeatures[className])
		// These only contain some features; specifically, ones in this classes' progression.
		sortedFeatures.sort((feature01, feature02) => {
			if (feature01 === feature02) {
				return 0
			}
			else if (feature01.slug > feature02.slug) {
				return 1
			}
			else if (feature01.slug < feature02.slug) {
				return -1
			}
			else {
				return 0
			}
		})

		// Loop through each sorted feature's data, in order.
		for (const feature of sortedFeatures) {

			// Get this feature's progression (rather than the whole class progression).
			const featureProgression = feature['classes'][className]['progression']
			if (featureProgression === undefined) {
				continue
			}

			// Each row in the featureProgression dictionary should already be sorted by levels.
			// Still, its safer to just re-sort it here; dictionaries are canonically unsorted.
			featureProgression.sort((row01, row02) => {
				if (row01 === row02) {
					return 0
				}
				else if (row01.Level > row02.Level) {
					return 1
				}
				else if (row01.Level < row02.Level) {
					return -1
				}
				else {
					return 0
				}
			})

			// Loop through each row of this feature's progression.
			// Each feature progression needs to be added to the class progression.
			for (const featureRow of featureProgression) {
				const level = featureRow.Level
				const cells = Object.entries(featureRow)
				for (const [featureColumn, value] of cells) {
					// "Level" already exists in all rows.
					if (featureColumn === 'Level') {/* do nothing */}

					// "Feature" represents a significant class ability.
					else if (featureColumn === 'Feature') {
						// Filter the entry whose level is equal.
						const primeRow = progression.find((row) => {
							return row.Level === level
						})
						// Once we have this entry, we can add to it.
						// Notice Features is plural, denoting an array.
						primeRow['Features'].push(value)
					}

					// Anything else represents a custom column (not a Level or Feature).
					else {
						// We have to loop through every level of entry.
						// If it hasn't been added, add it with a null value.
						// If the level is valid, replace it with the value.
						for (const primeRow of progression) {
							if (!(featureColumn in primeRow)) {
								primeRow[featureColumn] = null
							}
							if (primeRow.Level >= featureRow.Level) {
								primeRow[featureColumn] = value
							}
						}
					}
				}
			}

			// What's more -- the columns could be in a group!
			// For example, spell slots use a group of slot levels.
			const groupEntries = {}
			for (const primeRow of progression) {
				const cells = Object.entries(primeRow)
				for (const [primeColumn, group] of cells) {
					if (group instanceof Object && !(group instanceof Array)) {
						if (!(primeColumn in groupEntries)) {
							groupEntries[primeColumn] = []
						}
						for (const item in group) {
							if (!(groupEntries[primeColumn].includes(item))) {
								groupEntries[primeColumn].push(item)
							}
						}
					}
				}
			}

			// Now we have all the group keys.
			for (const primeRow of progression) {
				const cells = Object.entries(primeRow)
				for (const [primeColumn, group] of cells) {
					if (group instanceof Object && !(group instanceof Array)) {
						for (const subcolumn of groupEntries[primeColumn]) {
							if (!(subcolumn in group)) {
								group[subcolumn] = null
							}
						}
					}
				}
			}
			// Phew... All the keys will have been filled by now.
		}

		// Revert and sort class progresion before returning.
		progression.sort((row01, row02) => {
				if (row01 === row02) {
					return 0
				}
				else if (row01.Level > row02.Level) {
					return 1
				}
				else if (row01.Level < row02.Level) {
					return -1
				}
				else {
					return 0
				}
		})
		return progression
	}

	// with that helper function, we can get all classes!
	const classProgression = {}
	for (const className in classFeatures) {
		classProgression[className] = getOne(className)
	}
	// All class progressions have been completely filled.
	return classProgression
}

export {getClassFeatures, getClassProgression}
