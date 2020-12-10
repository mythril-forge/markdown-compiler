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
		selectionHTML += `\t<option value=${classItem['slug']}>${classItem['name']}</option>\n`
	}

	// Apply option-group items to selection input.
	document
	.querySelector('#class-selection select')
	.innerHTML = selectionHTML

	// Hook up event listener
	document
	.getElementById('class-selection')
	.addEventListener('input', hookLevelFields)

	// Unhide class selection fields.
	document
	.getElementById('class-selection')
	.removeAttribute('hidden')
}

const hookLevelFields = () => {
	const checkedNodes = document
	.querySelectorAll('#class-selection select option:checked')

	let levelingHTML = ''

	// Obtain option-group nodes.
	for (const node of checkedNodes) {
		const classSlug = node.value
		const classInfo = classes.find(classItem => classItem.slug === classSlug)
		levelingHTML += '\t<div>\n'
		levelingHTML += `\t\t<label for='${classInfo.slug}-levels'>${classInfo.name} Levels</label>\n`
		levelingHTML += `\t\t<div id=${classInfo.slug}-levels data-class='${classInfo.slug}'>`
		levelingHTML += `\t\t\t<input class='first-level' type='number' />\n`
		levelingHTML += `\t\t\t<input class='final-level' type='number' />\n`
		levelingHTML += `\t\t</div>`
		levelingHTML += '\t</div>\n'
	}

	// Apply class-level group items to the input array.
	document
	.getElementById('class-leveling')
	.innerHTML = levelingHTML

	// Hook up event listener
	document
	.querySelector('#describe-progression input')
	.addEventListener('click', hookWriteDescription)

	// Hide or unhide describe-progression button.
	if (levelingHTML) {
		document
		.getElementById('describe-progression')
		.removeAttribute('hidden')
	}
	else {
		document
		.getElementById('describe-progression')
		.setAttribute('hidden', true)
	}
}

const hookWriteDescription = () => {
	// Categorized class features.
	const featuresByName = features
	.reduce(groupByName(), {})

	const featuresByClass = features
	.reduce(groupByClasses(), {})

	const classLevelNodes = document
	.querySelectorAll('#class-leveling div div')

	// Create a useful progression table index for each class.
	// In the meantime, also collelct feature descriptions.
	let fullProgression = []
	let fullDescription = ''
	for (const node of classLevelNodes) {
		const classSlug = node['dataset']['class']
		const firstLevel = parseInt(node.querySelector('.first-level')['value']) - 1
		const finalLevel = parseInt(node.querySelector('.final-level')['value'])

		// Here is the progression table.
		const progression = features.map(fillProgression(classSlug, firstLevel, finalLevel))
		const description = generateDescriptions(progression, classSlug, featuresByClass, featuresByName)

		// Now combine it!
		fullProgression.push(...(progression ?? []))
		fullDescription += description
	}
	fullProgression = fullProgression.reduce(mergeProgression())

	// Obtain the template element.
	const templateEl = document.getElementById('character-data')

	// Create a summary for all the classes in this progression.
	const summaryTable = generateSummaryTable(fullProgression)
	templateEl.innerHTML = summaryTable

	// Classes and features are respectively returned
	// once they are digested by this file.
	templateEl.innerHTML += fullDescription
}

document
.querySelector('#fetch-character-data input')
.addEventListener('click', hookFetchData)
