const collect_data = (
	references = {
		'website': 'github.com',
		'account': 'mythril-forge',
		'project': 'character-data',
		'branch': 'dev',
		'version': 'homebrew',
	},
	redownload = true,
) => {
	/*
	This is the root of every function presented here.
	If there is no data, it will download the JSON data.
	Otherwise, it will simply use the JSON data on-file.
	This function then returns a python object of that data.
	---
	This function is specifically designed for class features.
	*/
	// Make a copy of the references object in case its ever changed.
	const references = {...references}

	// Determine repository download URL.
	let downloadUrl = 'https://'
	downloadUrl += `${references.website}/`
	downloadUrl += `${references.account}/`
	downloadUrl += `${references.project}/`
	downloadUrl += 'archive/'
	downloadUrl += `${references.branch}.zip`

	// Determine downloaded file reference.
	let downloadDir = './downloads/'
	downloadDir += `${references.project}-`
	downloadDir += `${references.branch}/`

	/*
	classes = collect_classes()
	features = collect_features()
	return classes, features
	*/
}
