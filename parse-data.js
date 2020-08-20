/* OBTAIN CODE IMPORTS */
// You can change this string to './request-data.rest.js' to use the REST API.
// Purely from a speed standpoint, the GraphQL API is much better for our purposes.
import requestedFiles from './request-data.graphql.js'


/* SET UP DATA PARSERS & SORTERS */
// Using the text from the API, this module can properly parse JSON.
// The JSON entered into normal JavaScript objects, and the markdown entry is added.
const collectFeatures = (files) => {
	files = Object.entries(files)

	// Fill in the features object to get some nice fat data.
	let features = {}
	for (let [fileName, fileData] of files) {

		// Obtain the proper fileName and fileType.
		const fileNames = fileName.split('.')
		const fileType  = fileNames.pop().toLowerCase()
		fileName = fileNames.join('.')

		// Add the filename to the features dict.
		if (!(fileName in features)) {
			features[fileName] = {}
		}
		// Parse JSON formatted files.
		if (fileType === 'json') {
			fileData = JSON.parse(fileData)
		}
		// Prep markdown formatted files.
		else if (fileType === 'md') {
			fileData = {template: fileData}
		}
		// If there's some other format, there's an error.
		else {
			console.error(`
				Oh gosh, something went wrong.
				file: ${fileName}.${fileType}
				^^^ This was the cause of the error.
			`)
		}

		// Add the data to the filename dict.
		// Don't worry; this is a shallow copy.
		features[fileName] = {...features[fileName], ...fileData}
	}
	// Return compiled object.
	return features
}

// Without generating new objects, this function can filter each class feature.
// For example, it knows that "channel divinity" works for both "cleric" and "paladin".
const collectClassFeatures = (features) => {
	features = Object.entries(features)

	// Fill in classFeatures to get some nice fat data.
	let classFeatures = {}
	for (const [featureName, featureData] of features) {
		if ('classes' in featureData) {

			// Loop through each feature's classes for each feature.
			const classNames = Object.keys(featureData.classes)
			for (const className of classNames) {
				// Add new classes to the classFeatures object.
				if (!(className in classFeatures)) {
					classFeatures[className] = {}
				}
				// Add new features to the classFeatures object.
				if (!(featureName in classFeatures[className])) {
					classFeatures[className][featureName] = {}
				}
				// Add associated data.
				classFeatures[className][featureName] = featureData
			}
		}
	}
	// Return compiled object.
	return classFeatures
}

/* ACTIVATE DATA PARSER */
// After awaiting the reequested files, this function makes the data more useable.
const parseData = async () => {
	const files = await requestedFiles
	const features = collectFeatures(files)
	const classFeatures = collectClassFeatures(features)
	return {
		features: features,
		classFeatures: classFeatures,
	}
}

/* MAKE MODULE EXPORTS */
// This will be exported as a promise.
// The next module will have to await the data as normal.
export default parseData()
