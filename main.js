import {requestFeatureData} from './request-data.graphql.js'
import {prepareFeatureData} from './prepare-data.js'
import {
	groupByClasses,
	groupByName,
	filterByClass,
	fillProgression,
} from './parse-data.js'


const main = async () => {
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
	const className = 'cleric'
	const featuresForClass = features.filter(filterByClass(className))

	// Create a useful progression table index for classes.
	const featureProgression = features.reduce(fillProgression(className), [
		{Level: 1, Features: []},
		{Level: 2, Features: []},
		{Level: 3, Features: []},
		{Level: 4, Features: []},
		{Level: 5, Features: []},
		{Level: 6, Features: []},
		{Level: 7, Features: []},
		{Level: 8, Features: []},
		{Level: 9, Features: []},
		{Level: 10, Features: []},
		{Level: 11, Features: []},
		{Level: 12, Features: []},
		{Level: 13, Features: []},
		{Level: 14, Features: []},
		{Level: 15, Features: []},
		{Level: 16, Features: []},
		{Level: 17, Features: []},
		{Level: 18, Features: []},
		{Level: 19, Features: []},
		{Level: 20, Features: []},
	])

	// Create a summary for all the classes.

	// Classes and features are respectively returned
	// once they are digested by this file

	console.info('features:')
	console.dir(features)
	console.dir(featuresByName)
	console.info('grouped:')
	console.dir(featuresForClass)
	console.info('progression:')
	console.dir(featureProgression)
}

document.getElementById('fetch-button').addEventListener('click', main)
