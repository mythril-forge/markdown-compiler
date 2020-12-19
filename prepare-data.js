import {readLevels} from './helpers.js'
import {RegExX} from './reg-exx.js'
import {initParseData} from './parse-data.js'

/* PREPARE RETRIEVED API DATA */
// Using the text from the API, this module can properly parse JSON.
// The JSON entered into normal JavaScript objects, and the markdown entry is added.

// Start by initializing these useful values in the module.
let classes = null
let features = null


const prepareClassData = (classData) => {

	// First, collect all the filenames from the classData keys.
	// This isn't necessary, but will help catch errors from missing and extra files.
	// Note that the keys have a filetype extention, so they need to be cut off.
	const filepaths = Object.keys(classData)
	const filenames = filepaths.reduce(collectNamesFromPaths, new Set([]))

	// Fill in a new object with data as each filename is iterated over.
	classes = []
	for (const filename of filenames) {
		// Gather the filepaths to get data.
		const jsonFilepath = filename + '.json'
		const descFilepath = filename + '.md'

		// It's not okay if the JSON file doesn't exist.
		const classy = JSON.parse(classData[jsonFilepath])
		classes.push(classy)

		// It's okay if the markdown file doesn't exist.
		const template = classData[descFilepath] || null

		if (template !== null) {
			// It's likely that the template is valid if no class explicitly gets it.
			// Still, it is safer to pass the template through the parser anyway.
			const markdown = prepareDescription(template, classy, null)
			classy['markdown'] = markdown
		}
		else {
			// Pass. There's no markdown description for this classy.
		}
	}
	// Return compiled object.
	initParseData(classes, features)
	return classes
}

const prepareFeatureData = (featureData) => {

	// First, collect all the filenames from the featureData keys.
	// This isn't necessary, but will help catch errors from missing and extra files.
	// Note that the keys have a filetype extention, so they need to be cut off.
	const filepaths = Object.keys(featureData)
	const filenames = filepaths.reduce(collectNamesFromPaths, new Set([]))

	// Fill in a new object with data as each filename is iterated over.
	features = []

	for (const filename of filenames) {

		// Gather the filepaths to get data.
		const jsonFilepath = filename + '.json'
		const descFilepath = filename + '.md'

		// It's not okay if the JSON file doesn't exist.
		const feature = JSON.parse(featureData[jsonFilepath])

		// Configure the data from the JSON.
		for (const classSlug of Object.keys(feature['classes'] ?? [])) {
			// Get true class name.
			const className = classes.find((classItem) => {
				return classItem['slug'] === classSlug
			})['name']

			// Reconfigure leveling format hierarchy.
			for (const featureRow of feature['classes'][classSlug]['progression'] ?? []) {
				featureRow['Levels'] ??= {}
				featureRow['Levels'][`${className} Level`] = featureRow['Level']
				delete featureRow['Level']
			}
		}
		features.push(feature)

		// It's okay if the markdown file doesn't exist.
		const template = featureData[descFilepath] || null
		if ('classes' in feature && template !== null) {

			// Loop through every class that has this feature.
			for (const classSlug in feature['classes']) {

				// Then, parse the pseudo-markdown template and make it valid.
				// There is metadata attached that helps fill in the blanks.
				const markdown = prepareDescription(template, feature, classSlug)
				feature['classes'][classSlug]['markdown'] = markdown
			}
		}
		else if (template !== null) {

			// It's likely that the template is valid if no class explicitly gets it.
			// Still, it is safer to pass the template through the parser anyway.
			const markdown = prepareDescription(template, feature, null)
			feature['markdown'] = markdown
		}
		else {
			// Pass. There's no markdown description for this feature.
		}
	}

	// Return compiled object.
	initParseData(classes, features)
	return features
}

const prepareDescription = (template, feature, classSlug) => {
	// Base case: there is no valid classSlug.
	if (classSlug === null) {
		return template
	}

	// Get true class name.
	const className = classes.find((classItem) => {
		return classItem['slug'] === classSlug
	})['name']

	// Track each visited text-tag.
	const visitedTags = []

	// Obtain a shorthand for the progression table.
	const progression = feature['classes'][classSlug]['progression'] || []

	// The progression table may not be sorted. Sort it!
	progression.sort((row01, row02) => {
		const level01 = row01['Levels'][`${className} Level`]
		const level02 = row02['Levels'][`${className} Level`]
		if (row01 === row02) {
			return 0
		} else if (level01 > level02) {
			return 1
		} else if (level01 < level02) {
			return -1
		} else {
			return 0
		}
	})

	// This is where the meat of the function happens.
	// Search for a template-tag within the template.
	const tagExpression = /`\{\( .+? \)\}`/
	let tagSearch = new RegExX(tagExpression, template)

	// Transform tags into readable text while they exist.
	while (tagSearch.continues) {

		// Get substrings from search result.
		const tag = tagSearch.match.slice(4, -4)
		let left = tagSearch['left']
		let right = tagSearch['right']
		let middle = ''

		// Replace tag with designated classSlug.
		if (tag === 'class') {
			middle = classSlug
		}

		// Replace tag with a level signature.
		else if (tag === 'level' || tag === 'end-levels' || tag === 'all-levels') {

			// Create a reducer function to obtain the number of level tags seen so far.
			const countVisitedLevelTags = (count, tag) => {
				// Increment count if the tag matches.
				count += (tag === 'level')
				// The end-levels tag means all tags are visited.
				count += (tag === 'end-levels' * Infinity || 0)
				return count
			}

			// Use reducer function to get number of matches.
			const countedVisits = visitedTags.reduce(countVisitedLevelTags, 0)

			// If tag is all-levels, add all levels ever.
			if (tag === 'all-levels') {
				// Collect each of the feature's row-level for this action.
				const levels = progression.map(row => row['Levels'][`${className} Level`])
				// Add textified level signature ordinals.
				middle = readLevels(...levels)
			}

			// Add a single level.
			else if (tag === 'level' && countedVisits < progression.length) {
				// Get the associated row. This row's index equals the current number of visits.
				const row = progression[countedVisits]
				// Get the level.
				const level = row['Levels'][`${className} Level`]
				// Stringify the level signature using ordinals.
				middle = readLevels(level)
			}

			// Add multiple levels.
			else if (tag === 'end-levels' && countedVisits < progression.length) {
				// Collect each of the feature's valid row-level for this action.
				const levels = progression.slice(countedVisits).map(row => row['Levels'][`${className} Level`])
				// Stringify the level signature using ordinals.
				middle = readLevels(...levels)
			}

			// Delete the line entry if level is out of range.
			else {

				// Set expressions.
				const leftLineExpression = /(^|\n).*?$/
				const rightLineExpression = /^.*?(\n|$)/
				// Get search objects & matches.
				const leftLineSearch = new RegExX(leftLineExpression, left)
				const rightLineSearch = new RegExX(rightLineExpression, right)
				const leftLine = leftLineSearch['match']
				const rightLine = rightLineSearch['match']

				// Delete line.
				left = leftLineSearch['left']
				right = rightLineSearch['right']
				// If there's two newlines, replace with a single newline.
				if (leftLine.includes('\n') && rightLine.includes('\n')) {
					middle = '\n'
				}
				// Otherwise, the object contained had one or less newlines.
				else {
					middle = ''
				}
			}
		}

		// Check if the tag is a variable nametag.
		else if (tag in feature['classes'][classSlug]['variables']) {
			middle = feature['classes'][classSlug]['variables'][tag]
		}

		// Otherwise the tag is malformed.
		else {
			throw new Error(tag)
		}

		// Consider this tag visited.
		visitedTags.push(tag)
		// Update the markdown template.
		template = left + middle + right
		// Check next tag for next iteration.
		tagSearch = new RegExX(tagExpression, template)
	}

	// Return newly cleaned markdown template.
	// By now, the template should be a fully valid markdown string.
	return template
}

/* SET UP NICHE HELPER FUNCTIONS */
// To parse through the file data in the API, each file name needs
const collectNamesFromPaths = (filenames, filepath) => {

	// Obtain the proper filename from the filepath.
	const fragments = filepath.split('.')

	// Remove file extention; its not needed here.
	fragments.pop()

	// Reconnect fragments to get true filename.
	const filename = fragments.join('.')

	// Add the filename to the full set of filenames.
	filenames.add(filename)
	return filenames
}

/* MAKE MODULE EXPORTS */
// This will be exported as a promise.
// The next module will have to await the data as normal.
export {
	prepareFeatureData,
	prepareClassData,
}
