/* SET UP DATA PARSERS & SORTERS */
// Using the text from the API, this module can properly parse JSON.
// The JSON entered into normal JavaScript objects, and the markdown entry is added.
const getFeatures = (files) => {
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

/* MAKE MODULE EXPORTS */
// This will be exported as a promise.
// The next module will have to await the data as normal.
export {
	getFeatures,
	// getClasses,
}
