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
While this isn't itself a reducer, it returns a reducer function.
The reducer returns a special progression array with all implied entries filled in.
It assumes all features in the array are a part of the progression.
---
By default, the progression table will be sorted by level.
Each class has a progression table, and each get returned.
*/
const fillProgression = (className, levelOffset = 0, levelMaximum = 20) => {

	// Create another function to be returned.
	const reducer = (progression, feature) => {

		// Determine the progression array for this feature, if it is valid.
		// Each progression row has a distinct level, offset by the optional metaparameter.
		// ---
		// An object or dictionary could have been used, but this will be ported to JSON.
		// Note that JSON doesn't support integer keys. I don't like that.

		try {
			// Get this feature's progression (rather than the whole class progression).
			// Also, make a copy of it since we plan to sort and otherwise manipulate it.
			var progressionData = [...feature['classes'][className]['progression']]
		}

		catch {
			// if there was some error, this feature can't be added.
			return progression
		}

		progressionData = progressionData.filter((dataRow) => {
			return dataRow['Level'] + levelOffset <= levelMaximum
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
				if (column === 'Level') {/* do nothing */}

				// "Feature" represents a significant class ability.
				else if (column === 'Feature') {

					// Filter the entry whose level is equal.
					const row = progression.find((row) => {
						return row['Level'] === dataRow['Level'] + levelOffset
					})

					// Once we have this entry, we can add to it.
					// Notice Features is plural, denoting an array.
					row['Features'].push(data)
				}

				// Anything else represents a custom column (not a Level or Feature).
				else {

					// We have to loop through every level of entry in this case.
					for (const row of progression) {

						// Before anything, check whether the cell data's type is string.
						if (typeof data === 'string' || typeof data === 'number') {

							// If it hasn't been added, initialize it with a null value.
							if (!(column in row)) {
								row[column] = null
							}

							// If the level is valid, replace it with the value.
							if (row['Level'] >= dataRow['Level'] + levelOffset) {
								row[column] = data
							}
						}

						// If its not a string, it should be an object.
						else if (typeof data === 'object') {

							// The column name should be in every row. As an object, it has subcolumns.
							if (!(column in row)) {
								row[column] = {}
							}

							// Add subdata to the respective row + subcolumns.
							const subdataCells = Object.entries(data)
							for (const [subcolumn, subdata] of subdataCells) {

								// The subcolumn name should be in every row, too.
								if (!(subcolumn in row[column])) {
									row[column][subcolumn] = null
								}

								// If the level is valid, replace it with the value.
								if (row['Level'] >= dataRow['Level'] + levelOffset) {
									row[column][subcolumn] = subdata
								}
							}
						}
					}
				}
			}
		}

		// Pass the progression object to the next chain item.
		return progression
	}

	// Return the new reducer function.
	return reducer
}

export {
	filterByClass,
	groupByClasses,
	groupByName,
	fillProgression,
}
