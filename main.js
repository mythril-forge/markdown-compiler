import {requestFeatureData} from './request-files.graphql.js'
import {parseFeatures} from './parse-data.js'


(async () => {
	// Obtain all features, ever.
	let featureData = requestFeatureData()
	// let classData = requestClassData()
	featureData = await featureData
	// classData = await classData
	const features = parseFeatures(featureData)
	// const classes = parseClasses(classData)

	// Ensure every feature has a description for every class.

	// Categorized class features.

	// Create a useful progression table index for classes.

	// Create a summary for all the classes.


	// Classes and features are respectively returned
	// once they are digested by this file
	console.dir(classes)
	console.dir(features)
})()
