import {requestFeatureData} from './request-data.graphql.js'
import {prepareFeatureData} from './prepare-data.js'
import {
	groupByClasses,
	groupByName,
	filterByClass,
} from './parse-data.js'


(async () => {
	// Obtain all features, ever.
	const featurePromise = requestFeatureData()
	// const classPromise = requestClassData()
	const featureData = await featurePromise
	// const classData = await classPromise
	const features = prepareFeatureData(featureData)
	// const classes = prepareClassData(classData)

	const featuresByClass = features.reduce(groupByClasses(), {})
	const featuresByName = features.reduce(groupByName(), {})
	const featuresForRogue = features.filter(filterByClass('rogue'))
	// console.dir(getClassProgression(featuresByClass))
	// Ensure every feature has a description for every class.

	// Categorized class features.

	// Create a useful progression table index for classes.

	// Create a summary for all the classes.

	// Classes and features are respectively returned
	// once they are digested by this file

	console.info('features:')
	console.dir(features)
	console.dir(featuresByName)
	console.info('grouped:')
	console.dir(featuresForRogue)
})()
