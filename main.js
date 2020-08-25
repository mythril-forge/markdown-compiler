import {requestFeatureData} from './request-data.graphql.js'
// import {parseFeatures} from './parse-data.js'


(async () => {
	// Obtain all features, ever.
	const featurePromise = requestFeatureData()
	// const classPromise = requestClassData()
	const featureData = await featurePromise
	// const classData = await classPromise
	// const features = parseFeatures(featureData)
	// const classes = parseClasses(classData)

	// Ensure every feature has a description for every class.

	// Categorized class features.

	// Create a useful progression table index for classes.

	// Create a summary for all the classes.

	// Classes and features are respectively returned
	// once they are digested by this file

	console.dir(featureData)
	// console.dir(classes)
	// console.dir(features)
})()
