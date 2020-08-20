/* OBTAIN CODE IMPORTS */
// These static variables are neatly stored in another file.
import {
	fetchInit,
	endpoint,
	account,
	project,
	branch,
	version,
} from './variables.js'

// The GitHub REST API structure includes commits, branches, file-trees, and file-blobs.
// This particular module only cares about the latter three.

/* SET UP API INTERACTIONS */
// Given a branch object, obtain its HEAD commit's root file-tree.
const getTreeFromBranch = async (
	branch,
) => {
	// Obtain the treeURL from the branch.
	const treeRef = branch['commit']['commit']['tree']
	const treeURL = treeRef['url']

	// Fetch the tree.
	const response = await fetch(treeURL, fetchInit)
	const tree = await response.json()
	return tree
}

// Given a tree, path, and optional nodeType, get the next node.
const getNodeFromTree = async (
	tree,
	nodePath = '',
	nodeType = undefined,
) => {

	// If the node path is empty, then the node is the tree!
	let node = tree
	// Continuously deconstruct nodePath until it is empty.
	while (nodePath !== '') {

		// Get current node name, and the rest, from nodePath.
		const [nodeName, ...nodeNames] = nodePath.split('/')
		// Join the rest to get the remaining nodePath.
		nodePath = nodeNames.join('/')

		// Declare chosen-node parameters via helper function.
		const finder = (child) => {
			if (nodePath !== '') {
				return (child['path'] === nodeName)
				&& (child['type'] === 'tree')
			}
			else if (nodeType !== undefined) {
				return (child['path'] === nodeName)
				&& (child['type'] === nodeType)
			}
			else {
				return (child['path'] === nodeName)
			}
		}

		// Using finder, obtain the next nodeRef from this node.
		const nodeRef = await node['tree'].find(finder)
		const nodeURL = await nodeRef['url']

		// Fetch the next node, and replace the current node.
		const response = await fetch(nodeURL, fetchInit)
		node = await response.json()
	}

	// The final node is revealed when thee nodePath is empty.
	return node
}

// Given a tree, obtain a dictionary of blobs.
const getBlobsFromTree = async (
	tree,
) => {

	// Loop through all the blobRefs in the tree.
	const blobs = {}
	for (const blobRef of tree['tree']) {
		if (blobRef['type'] === 'blob') {
			// Use the blobPath and blobURL to get & set info.
			const blobPath = blobRef['path']
			const blobURL = blobRef['url']

			// Fetch the blob and add it to the lookup object.
			const response = await fetch(blobURL, fetchInit)
			const blob = await response.json()
			blobs[blobPath] = blob
		}
	}

	// Once all blobs are obtained, return them.
	// Note, the text will still be compressed in base64.
	return blobs
}

// Given a blob, obtain the text content.
const getContentFromBlob = async (
	blob,
) => {
	// Obtain the content.
	// However, if its encoded, decode it with atob()
	if (blob['encoding'] === 'base64') {
		return atob(blob['content'])
	}
	else if (blob['encoding'] === 'utf-8') {
		return	blob['content']
	}
}

/* CREATE THE DATA COLLECTOR */
// Create an async function to make the requests.
const getFileData = async () => {
	// The initial git branch can be determined by the imported variables.
	const branchURL = `https://${endpoint}/repos/${account}/${project}/branches/${branch}`
	console.warn(branchURL)
	const response = await fetch(branchURL, fetchInit)
	const branchObj = await response.json()

	// The module can make deeper calls once the branchObj is determined..
	const rootTreeObj = await getTreeFromBranch(branchObj)
	const blobTreePath = `source/${version}/abilities/features/`
	const blobTreeObj = await getNodeFromTree(rootTreeObj, blobTreePath)
	const blobObjDict = await getBlobsFromTree(blobTreeObj)

	// The resulting object has a bit too much info, so I'm flattening it a bit.
	// Loop through all the blobs to consolidate the data.
	const files = {}
	const entries = Object.entries(blobObjDict)
	for (const [entryName, blobObj] of entries) {
		// Decode the blobs to just give back some text.
		const entryText = await getContentFromBlob(blobObj)
		files[entryName] = entryText
	}
	console.info('done downloading!')

	// Return all the files in a Promise.
	return files
}

/* MAKE MODULE EXPORTS */
console.log(getFileData())
// This will resolve the promise and print it to console.
// You can expand the objects and subobjects to see data.
// export default getFileData()
