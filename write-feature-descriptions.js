import {readLevels, ordinal} from './helpers.js'
import {RegExX} from './reg-exx.js'



const generateDescriptions = (allFeatures) => {
	// Loop through all the features!
	for (const feature of Object.values(allFeatures)) {

		// Loop through each class in the feature.
		for (const className of features['classes']||{}) {
			const featureClassInfo = feature['classes'][class_name]
			let description = describe(feature, className)
			// If the feature has children, loop through them.
			for (const childName of featureClassInfo['children']||{}) {
				const child = allFeatures[childName]
				let addon = describe(child, class_name)
				addon = addon.replace('# ', '## ')
				if (addon != '') {
					description += '\n'
					description += addon
				}
			}
			description = description.replace('# ', '## ')
			// The description is complete for this featureClassInfo!
			featureClassInfo['description'] = description
		}
	}
}



const describe(feature, className) {
	let markdown = feature['template']
	// Track each visited text-tag.
	const visitedTags = []

	if ('classes' in feature) {
		// Get the class data from this feature.
		const featureClassInfo = feature['classes'][className]

		// Certain subfeatures will not have a progression.
		// Dont try to set progression in this case.
		if ('progression' in featureClassInfo) {
			// Get the progression table for this class.
			const progression = feature['classes'][className]['progression']
			// The progression table may not be sorted. Sort it!
			progression.sort((a, b) => {
				if (a === b) {
					return 0
				} else if (a.Level > b.Level) {
					return 1
				} else if (a.Level < b.Level) {
					return -1
				} else {
					return 0
				}
			})

	// This is where the meat of the function happens.
	// Try to find a tag.
	let tagSearch = getTag(markdown)
	// Transform tags into readable text while they exist.
	while (tagSearch.continues) {
		// Get indices from search result.
		const [start, end] = tagSearch.span
		const tag = tagSearch.match.slice(4, -4)
		let left = markdown.slice(0, start)
		let right = markdown.slice(end)
		let middle = ''

		// Replace tag with designated class name.
		if (tag === 'class') {
			middle = className
		}

		// Replace tag with a level signature.
		else if (['level', 'end-levels', 'all-levels'].includes(tag)) {
			// Create and use reducer to get number of matches.
			const reducer = (count, tag) => count + (tag === 'level')
			const matches = visitedTags.reduce(reducer, 0)
			// The end-levels tag means all tags are visited.
			if (visitedTags.includes('end-levels')) {matches += Infinity}

			// If tag is all-levels, add all levels ever.
			if (tag === 'all-levels') {
				// Initialize levels for this action.
				const levels = []
				// Get all the rows in this feature.
				for (row of progression) {
					// Get the level.
					level = row.Level
					levels.append(level)
				}
				// Add textified level signature ordinals.
				middle = readLevels(...levels)
			}

			// Ensure index is in range of the progression table.
			else if (matches < progression.length) {

				// Add a single level.
				if (tag === 'level') {
					// Get the associated row.
					const row = progression[matches]
					// Get the level.
					const level = row.Level
					// Add textified level signature ordinals.
					middle = readLevels(level)

				// Add multiple levels.
				else if (tag === 'end-levels') {
					// Initialize levels for this action.
					const levels = []
					// Get all the remaining unvisted rows.
					for (const row of progression.slice(matches)) {
						// Get the level.
						const level = row.Level
						levels.append(level)
					}
					// Add textified level signature ordinals.
					middle = readLevels(...levels)
				}
			}

			// Delete the line if level is out of range.
			else {
				// Get expressions.
				const leftExpression = /(^|\n).*?$/
				const rightExpression = /^.*?(\n|$)/
				// Get spans.
				const [end, ] = new RegExX(leftExpression, left).exec().span()
				const [, start] = new RegExX(rightExpression, right).exec().span()
				// Delete line.
				left = left.slice(0, end)
				right = right.slice(start)
				middle = '\n'
			}
		}

		// Replace tag with a level signature plurality.
		else if (tag === 'levels') {
			// Create reducer.
			const reducer = (list, row) => [...list, row.Level]
			// Use reducer to obtain all levels.
			const levels = progression.reduce(reducer, [])
			// Add textified level signature ordinals.
			middle = readLevels(...levels)
		}

		else if (tag in featureClassInfo['variables']||{}) {
			middle = featureClassInfo['variables'][tag]
		}

		// Tag is malformed.
		else {
			throw new Error(tag)
		}

		// Include this processed tag.
		visitedTags.push(tag)
		// Update markdown.
		markdown = left + middle + right
		// Check next tag.
		tagSearch = getTag(markdown)
	}

	// Return newly cleaned markdown.
	return markdown
}



// Helper function.
const getTag(markdown) {
	const expression = /`\{\( .+? \)\}`/
	return new RegExX(expression, markdown)
}
