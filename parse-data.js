const slotFeaturesByClass = (features) => {
	/*
	This will take in the features dataset. Each feature will be slotted by class.
	Note that a single feature can be slotted for zero or many classes.
	For example, a few classes get "Expertise", but none explicitly get "Dueling".
	The compiled collection of categorized features returns.
	---
	Each feature in the return object is pointed to, so it works well in memory.
	*/
	// Create base featuresByClass dictionary object.
	// Fill it in to get some nice fat data.
	const featuresByClass = {} // *this will be returned later*

	// Loop through all given features.
	// Each feature may exist for zero or many classes.
	// This works fine in memory; many classes' entries may point to the same feature.
	for (const [featureName, feature] of Object.entries(features)) {

		// Loop through each feature's classes for each feature.
		for (const className in feature['classes'] || {}) {

			// Its only featured if it has a progression for this class.
			if ('progression' in feature['classes'][className]) {

				// Add new classes to the featuresByClass object.
				if (!(className in featuresByClass)) {
					featuresByClass[className] = {}
				}

				// Add new features to the featuresByClass object.
				featuresByClass[className][featureName] = feature
			}
		}
	}

	// Return populated featuresByClass dictionary.
	return featuresByClass
}



const composeClassProgressions = (classFeatures) => {
	/*
	This takes in compiled classFeatures.
	By looping through each class and feature, this function
	is able to create a table for players to use as an index.
	By default, the progression table will be sorted by level.
	Each class has a progression table, and each get returned.
	*/
	// Create a sortedClassFeatures dictionary object.
	// Also create a classProgression dictionary object.
	const sortedClassFeatures = {}
	const classProgressions = {} // *this will be returned later*


	// Loop through each and every className.
	for (const className in classFeatures) {
		// Initialize empty array to hold class progression rows.
		// Each row will have a distinct level.
		// ---
		// An object or dictionary could have been used, but...
		// This data will be ported over to JSON.
		// JSON doesn't support integer keys. I don't like that.
		const classProgression = []
		classProgressions[className] = classProgression
		for (const level in [...(new Array(20)).keys()].map(lv=>lv+1)) {
			classProgression.push({
				'Level': level,
				'Features': [],
			})
		}

		// Create an array of class features, sorted by names.
		// These only contain certain features; specifically, the
		// 	ones for this class that appear in the progression.
		const sortedFeatures = Object.values(classFeatures[className])
		sortedFeatures.sort((a, b) => {
			if (a === b) {
				return 0
			}
			else if (a.slug > b.slug) {
				return 1
			}
			else if (a.slug < b.slug) {
				return -1
			}
			else {
				return 0
			}
		})

		// Loop through each sorted feature's data, in order.
		for (const feature of sortedFeatures) {

			// Here, progression is short for feature progression.
			// 	(rather than the whole class progression)
			progression = feature['classes'][className]['progression']

			// Each row in the progression dictionary should
			// 	already be sorted numerically by levels.
			// Even so, it may be safer to just re-sort it here.
			progression.sort((a, b) => {
				if (a === b) {
					return 0
				}
				else if (a.Level > b.Level) {
					return 1
				}
				else if (a.Level < b.Level) {
					return -1
				}
				else {
					return 0
				}
			})

			// Loop through each row of this feature's progression.
			// Each feature has a progression that should be added
			// 	to the entire class progression table.
			for (const row of progression) {
				const level = row.Level
				for (const [column, value] of Object.entries(row)) {

					// "Level" already exists in all rows.
					if (column === 'Level') {
						// pass
					}

					else if (column === 'Feature') {
						// Filter the entry whose level is equal.
						const filterer = row => row.Level === level
						const entry = classProgression.filter(filterer)
						// Once we have this entry, we can add to it.
						// Notice Features is plural, denoting an array.
						entry['Features'].push(value)
					}

					else {
						// The column is custom (not a Level or Feature).
						// We have to loop through every level of entry.
						// If it hasn't been added, add it with None.
						// If the level is valid, replace it with value.
						for (const entry of classProgression) {
							if (!(column in entry)) {
								entry[column] = null
							}
							if (entry.Level >= row.Level) {
								entry[column] = value
							}
						}
					}
				}
			}

			// What's more -- the columns could be in a group!
			const groupEntries = {}
			for (const row of progression) {
				for (const [column, group] of Object.entries(row)) {
					if ((group instanceof Object) && !(group instanceof Array)) {
						if (!(column in groupEntries)) {
							groupEntries[column] = []} // ! brackets for git diff ! //
						for (const item of group) {
							if (!(item in groupEntries[column])) {
								groupEntries[column].push(item)}}}}} // ! brackets for git diff ! //
			// Now we have all the group keys.
			for (const row of progression) {
				for (const [column, group] of Object.entries(row)) {
					if ((group instanceof Object) && !(group instanceof Array)) {
						for (const subcolumn of  groupEntries[column]) {
							if (!subcolumn in group) {
								group[subcolumn] = null }}}}} // ! brackets for git diff ! //
			// Phew... All the keys will have been filled.
		}

		// Revert and sort class progresions
		classProgression.sort((a, b) => {
			if (a === b) {
				return 0
			}
			else if (a.Level > b.Level) {
				return 1
			}
			else if (a.Level < b.Level) {
				return -1
			}
			else {
				return 0
			}
		})
		classProgressions[className] = classProgression
	}

	// All class progressions have been completely filled.
	return classProgressions
}

export {
	slotFeaturesByClass,
	// composeClassProgressions,
}
