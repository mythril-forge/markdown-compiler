import {requestClassData, requestFeatureData} from './request-data.graphql.js'

import {prepareClassData, prepareFeatureData} from './prepare-data.js'

import {
	groupByName,
	groupByClasses,
	filterByClass,
	fillProgression,
	mergeProgression,
} from './parse-data.js'

import {
	generateSummaryTable,
	generateDescriptions,
} from './write-descriptions.js'

let features = null
let classes = null

const fetchData = async () => {
	// Obtain all classes & features, ever.
	const featurePromise = requestFeatureData()
	const classPromise = requestClassData()

	// Await for all of those details.
	const featureData = await featurePromise
	const classData = await classPromise

	// Digest those data into more useable objects.
	features ??= prepareFeatureData(featureData)
	classes ??= prepareClassData(classData)
}

const hookFetchData = async () => {
	// Disable the button first and foremost
	document
	.querySelector('#fetch-character-data input')
	.setAttribute('disabled', true)

	await fetchData()
	let selectionHTML = ''

	// Obtain option-group items.
	for (const classItem of classes) {
		console.log(classItem['slug'])
		selectionHTML += '\n'
		selectionHTML += `\t<option value=${classItem['slug']}>${classItem['name']}</option>`
	}
	selectionHTML += '\n'

	// Apply option-group items to selection input.
	document
	.querySelector('#class-selection select')
	.innerHTML = selectionHTML

	// Unhide class selection fields.
	document
	.getElementById('class-selection')
	.removeAttribute('hidden')

	/* EXPERIMENTATION BELOW */
	/***************************************************************************************
	// Categorized class features.
	const featuresByName = features
	.reduce(groupByName(), {})

	const featuresByClass = features
	.reduce(groupByClasses(), {})

	// Create a useful progression table index for this class.
	const clericProgression = featuresByClass['cleric']
	.map(fillProgression('cleric', 0, 5))

	const wizardProgression = featuresByClass['wizard']
	.map(fillProgression('wizard', 5, 20))

	const fullProgression = [...wizardProgression, ...clericProgression]
	.reduce(mergeProgression())

	// Obtain the template element.
	const templateEl = document.getElementById('character-data')

	// Create a summary for all the classes in this progression.
	const summaryTable = generateSummaryTable(fullProgression)
	templateEl.innerHTML = summaryTable

	// Classes and features are respectively returned
	// once they are digested by this file.
	templateEl.innerHTML += generateDescriptions(clericProgression, 'cleric', featuresByClass, featuresByName)
	templateEl.innerHTML += generateDescriptions(wizardProgression, 'wizard', featuresByClass, featuresByName)

	console.info('progression:')
	console.dir(fullProgression)
	***************************************************************************************/
}

document
.querySelector('#fetch-character-data input')
.addEventListener('click', hookFetchData)
