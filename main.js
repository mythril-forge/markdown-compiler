import {requestFeatureData} from './request-data.graphql.js'
import {prepareFeatureData} from './prepare-data.js'
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

const main = async () => {
	// Obtain all features, ever.
	const featurePromise = requestFeatureData()
	// const classPromise = requestClassData()
	const featureData = await featurePromise
	// const classData = await classPromise
	const features = prepareFeatureData(featureData)
	// const classes = prepareClassData(classData)

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
}

document.getElementById('fetch-button').addEventListener('click', main)
