import {requestFeatureData} from './request-data.graphql.js'
import {prepareFeatureData} from './prepare-data.js'
import {
	groupByClasses,
	groupByName,
	filterByClass,
	fillProgression,
	mergeProgression,
} from './parse-data.js'

(async () => {
	// Obtain all features, ever.
	const featurePromise = requestFeatureData()
	// const classPromise = requestClassData()
	const featureData = await featurePromise
	// const classData = await classPromise
	const features = prepareFeatureData(featureData)
	// const classes = prepareClassData(classData)

	// Categorized class features.
	const featuresByClass = features.reduce(groupByClasses(), {})
	const featuresByName = features.reduce(groupByName(), {})

	// Dictate an arbitrary class to look up. Then, look it up.
	const className = 'cleric'
	const featuresForClass = features.filter(filterByClass(className))

	// Create a useful progression table index for this class.
	const clericProgression = features.filter(filterByClass('cleric')).map(fillProgression('cleric', 0, 4))
	const wizardProgression = features.filter(filterByClass('wizard')).map(fillProgression('wizard', 4, 20))
	const progressionTable = [...wizardProgression, ...clericProgression].reduce(mergeProgression())

	// Create a summary for all the classes.

	// Classes and features are respectively returned
	// once they are digested by this file

	console.info('features:')
	console.dir(features)
	console.dir(featuresByName)
	console.info('grouped:')
	console.dir(featuresForClass)
	console.info('progression:')
	console.dir(progressionTable)
})()
