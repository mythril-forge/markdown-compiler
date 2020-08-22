/* FILE IMPORTS */
import {
	requestFeatureFiles,
	// requestClassFiles,
} from './request-files.graphql.js'

import {
	getFeatures,
	// getClasses,
} from './parse-files.js'

import {
	getClassFeatures,
	getClassProgression,
} from './parse-features.js'

/* MAIN FUNCTION */
const main = async () => {
	// Grab files first.
	let featureFiles = requestFeatureFiles()
	// let classFiles = requestClassFiles()
	featureFiles = await featureFiles
	// classFiles = await classFiles

	// Parse those files into more useable data.
	const features = getFeatures(featureFiles)
	// const classes = getClasses(classFiles)

	// Extrapulate various interesting sets of useable data.
	const classFeatures = getClassFeatures(features)
	const classProgression = getClassProgression(classFeatures) // , classes)
	//
	console.log(classProgression)
}

main()
