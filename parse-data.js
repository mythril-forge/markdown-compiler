/*
While this isn't itself a filterer, it returns a filterer function.
This inception is done to allow additional parameters to be passed in.
As other functions here, this is to be used with arrays of features.
*/
const filterByClass = (className) => {

	// We have a class name, and can use it to create a function without it as a parameter.
	const filterer = (feature) => {

		// It's better to ask for forgiveness than to ask for permission.
		try {

			// This is featured in our class only if a progression row has a "Feature" keyword.
			return feature['classes'][className]['progression'].some(row => 'Feature' in row)
		}

		// If there is some error, its because the expected keys or values didn't exist.
		catch {
			return false
		}
	}

	// Return a function.
	return filterer
}


/*
While this isn't itself a reducer, it returns a reducer function (like the others here).
This inception is done to be consistent with helpers that need additional parameters.
To get an easy-to-access dictionary of features, this can be called upon in arrays.
---
Note that a single feature can be slotted for zero or many classes.
For example, a few classes get "Expertise", but none explicitly get "Dueling".
The compiled collection of categorized features returns.
*/
const groupByClasses = () => {

	// Create another function to be returned.
	const reducer = (featuresPerClass, feature) => {

		// Loop through each class within each feature.
		const classNames = Object.keys(feature['classes'] || {})
		for (const className of classNames) {

			// It's better to ask for forgiveness than to ask for permission.
			try {

				// This is featured in our class if a progression row has a "Feature" keyword.
				if (feature['classes'][className]['progression'].some(row => 'Feature' in row)) {

					// Make this classes' entry if it doesn't yet exist.
					if (!(className in featuresPerClass)) {
						featuresPerClass[className] = []
					}

					// Add the feature to the entry.
					featuresPerClass[className].push(feature)
				}
			}

			// If there is some error, its because the expected keys or values didn't exist.
			catch {
				continue
			}
		}

		// Pass over the manipulated object to the next item in the reducer chain.
		return featuresPerClass
	}

	// Return the new reducer function.
	return reducer
}


/*
While this isn't itself a reducer, it returns a reducer function (like the others here).
This just creates an object from an array of features, with keys being feature names.
The function is needed to objectify the original array of features for easy-access.
*/
const groupByName = () => {

	// Create another function to be returned.
	const reducer = (featuresByName, feature) => {

		// The slug is required, so it must exist in all features.
		const slug = feature['slug']

		// This slug really shouldn't exist in the dictionary yet.
		if (slug in featuresByName) {
			throw new Error('Feature name collision detected.')
		}

		// Add the feature to the object with this slug and pass it over.
		featuresByName[slug] = feature
		return featuresByName
	}

	// Return the new reducer function.
	return reducer
}



/*
While this isn't itself a reducer, it returns a reducer function.
The reducer returns a special progression array with all implied entries filled in.
It assumes all features in the array are a part of the progression.
---
By default, the progression table will be sorted by level.
Each class has a progression table, and each get returned.
*/
const getClassProgression = (classFeatures) => {
	const getOne = (className) => {
		// Initialize empty array to hold class progression rows.
		// Each row will have a distinct level.
		// ---
		// An object or dictionary could have been used, but this will be ported to JSON.
		// JSON doesn't support integer keys. I don't like that.
		const progression = []
		let maxLevel = 20
		for (let level in [...(new Array(maxLevel)).keys()]) {
			level = parseInt(level) + 1
			progression.push({
				Level: level,
				Features: [],
			})
		}

		// Create an array of class features, sorted alphabetically by name.
		// These only contain some features; specifically, ones in this classes' progression.
		const sortedFeatures = Object.values(classFeatures[className])
		sortedFeatures.sort((feature01, feature02) => {
			if (feature01 === feature02) {
				return 0
			}
			else if (feature01['slug'] > feature02['slug']) {
				return 1
			}
			else if (feature01['slug'] < feature02['slug']) {
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
				else if (row01['Level'] > row02['Level']) {
					return 1
				}
				else if (row01['Level'] < row02['Level']) {
					return -1
				}
				else {
					return 0
				}
			})

			// Loop through each row of this feature's progression.
			// Each feature progression needs to be added to the class progression.
			for (const featureRow of featureProgression) {
				const level = featureRow['Level']
				const cells = Object.entries(featureRow)
				for (const [featureColumn, value] of cells) {
					// "Level" already exists in all rows.
					if (featureColumn === 'Level') {/* do nothing */}

					// "Feature" represents a significant class ability.
					else if (featureColumn === 'Feature') {
						// Filter the entry whose level is equal.
						const primeRow = progression.find((row) => {
							return row['Level'] === level
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
							if (primeRow['Level'] >= featureRow['Level']) {
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
			else if (row01['Level'] > row02['Level']) {
				return 1
			}
			else if (row01['Level'] < row02['Level']) {
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

export {
	filterByClass,
	groupByClasses,
	groupBySlug,
	getClassProgression,
}
