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
			return feature['classes'][className]['progression'] !== undefined
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
While this isn't itself a mapper, it returns a mapper function.
This mapper returns a series of progression arrays with all implied entries filled in.
It doesn't track feature names, but it doesn't have to either.
*/
const fillProgression = (className, levelOffset = 0, levelMaximum = 20) => {
	const levelSpan = levelMaximum - levelOffset

	// Create another function to be returned.
	const mapper = (feature) => {

		// Determine the full progression array for this feature.
		// Each progression row has a distinct level, offset by the optional metaparameters.
		// ---
		// An object or dictionary could have been used, but this will be ported to JSON.
		// Note that JSON doesn't support integer keys; arrays of objects are used instead.
		const progressionFull = [...new Array(levelSpan)].map((_, index) => {
			const level = 1 + index + levelOffset
			const row = {
				Level: level,
				Features: [],
			}
			return row
		})

		try {
			// Get this feature's progression. Make a copy since we plan to manipulate it.
			var progressionData = [...feature['classes'][className]['progression']]
		}

		catch {
			// If there was some error, this feature doesn't have progression.
			var progressionData = []
		}

		progressionData = progressionData.filter((row) => {
			// Remove all rows that don't satisfy the metaparameters.
			return row['Level'] + levelOffset <= levelMaximum
		})

		// Each row in the progressionData dictionary should already be sorted by levels.
		// Still, its safer to just re-sort it here; dictionaries are canonically unsorted.
		progressionData.sort((row01, row02) => {
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

		// Loop through each row & column of this feature's progression.
		// Each feature progression needs to be added to the class progression.
		for (const dataRow of progressionData) {
			const dataCells = Object.entries(dataRow)
			for (const [column, data] of dataCells) {

				// "Level" already exists in all rows.
				if (column === 'Level') {
					continue
				}

				// "Feature" represents a significant class ability.
				else if (column === 'Feature') {

					// Find the full row entry whose level matches.
					const fullRow = progressionFull.find((fullRow) => {
						return fullRow['Level'] === dataRow['Level'] + levelOffset
					})

					// Once we have this entry, we can add data to its "Features" array.
					fullRow['Features'].push(data)
				}

				// "Spell Slots per Slot Level" is special. It has several subcolumns.
				else if (column === 'Spell Slots per Slot Level') {
					for (const fullRow of progressionFull) {

						// If it hasn't been added, initialize the column with an empty object.
						if (!(column in fullRow)) {
							fullRow[column] = {}
						}

						// Loop through every subcolumn.
						const subdataCells = Object.entries(data)
						for (const [subcolumn, subdata] of subdataCells) {

							// The subcolumn name should be in every row, too.
							if (!(subcolumn in fullRow[column])) {
								fullRow[column][subcolumn] = null
							}

							// If the level is valid, replace it with the value.
							if (fullRow['Level'] >= dataRow['Level'] + levelOffset) {
								fullRow[column][subcolumn] = subdata
							}
						}
					}
				}

				// Anything else represents a custom column.
				else {
					for (const fullRow of progressionFull) {

						// The subcolumn name should be in every row, too.
						if (!(column in fullRow)) {
							fullRow[column] = null
						}

						// If the level is valid, replace it with the value.
						if (fullRow['Level'] >= dataRow['Level'] + levelOffset) {
							fullRow[column] = data
						}
					}
				}
			}
		}

		// Pass the progression object to the next chain item.
		return progressionFull
	}

	// Return the new mapper function.
	return mapper
}


const mergeProgression = () => {

	// Create another function to be returned.
	const reducer = (progressionFull, progressionData) => {

		for (const dataRow of progressionData) {

			const hasLevel = progressionFull.some((fullRow) => {
				return fullRow['Level'] === dataRow['Level']
			})

			if (hasLevel) {
				// Find the full row entry whose level matches.
				const fullRow = progressionFull.find((fullRow) => {
					return fullRow['Level'] === dataRow['Level']
				})

				const dataCells = Object.entries(dataRow)
				for (const [column, data] of dataCells) {

					// If the column hasn't been added, just copy the data.
					if (!(column in fullRow)) {
						fullRow[column] = data
					}

					else if (column === 'Level') {
						continue
					}

					else if (column === 'Features') {
						// Add data to the fullRow's "Features" array.
						fullRow['Features'].push(...data)
					}

					else if (column === 'Spell Slots per Slot Level') {
						// Loop through every subcolumn and update.
						const subdataCells = Object.entries(data)
						for (const [subcolumn, subdata] of subdataCells) {
							if (!(subcolumn in fullRow[column])) {
								fullRow[column][subcolumn] = subdata
							}
							else {
								fullRow[column][subcolumn] += subdata
							}
						}
					}
					else {
						throw new Error('Collision detected!')
					}
				}
			}
			else {
				progressionFull.push(dataRow)
			}
		}
		return progressionFull
	}
	return reducer
}


export {
	filterByClass,
	groupByClasses,
	groupByName,
	fillProgression,
	mergeProgression,
}
