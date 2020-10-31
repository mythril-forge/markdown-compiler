import {requestFeatureData} from './request-data.graphql.js'
import {prepareFeatureData} from './prepare-data.js'
import {
	groupByName,
	groupByClasses,
	filterByClass,
	fillProgression,
	mergeProgression,
} from './parse-data.js'
import {generateSummaryTable} from './write-descriptions.js'

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

	// Create a summary for all the classes in this progression.
	const summaryTable = generateSummaryTable(fullProgression)

	// Classes and features are respectively returned
	// once they are digested by this file

	console.info('progression summary table:')
	console.log(summaryTable)
	console.info('features:')
	console.dir(features)
	console.dir(featuresByName)
	console.info('progression:')
	console.dir(fullProgression)
}

document.getElementById('fetch-button').addEventListener('click', main)
