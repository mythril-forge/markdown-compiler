import {fileData as files} from './request-data.js'


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
				FileName: ${fileName}
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


const collectData = async (files) => {
	files = await files
	const features = collectFeatures(files)
	const classFeatures = collectClassFeatures(features)
	return {
		features: features,
		classFeatures: classFeatures,
	}
}


export const featureDataset = collectData(files)
