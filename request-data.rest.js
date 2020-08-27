/* OBTAIN CODE IMPORTS */
import {
	initOptions,
	endpoint as website,
	account,
	project,
	branch,
	version,
} from './variables.js'

/*
This file, and its functions, are the root of the entire dataset.
Every funciton preseented here stems from this dataset.
Since we are using JavaScript, we'll be leveraging fetch to get JSON.
---
This file also has a sister.
These sibling files are specifically designed for either the GraphQL or REST GitHub API.
Regardless, the D&D datset being used is Mythril Forge's Character Data.
*/

/* SET UP API INTERACTIONS */
// Given a branch object, obtain its HEAD commit's root file-tree.
const requestTreeFromBranch = async (
	branch,
) => {
	// Obtain the treeURL from the branch.
	const treeRef = branch['commit']['commit']['tree']
	const treeURL = treeRef['url']

	// Fetch the tree.
	const response = await fetch(treeURL, initOptions)
	const tree = await response.json()
	return tree
}

// Given a tree, path, and optional nodeType, get the next node.
const requestNodeFromTree = async (
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
		const response = await fetch(nodeURL, initOptions)
		node = await response.json()
	}

	// The final node is revealed when thee nodePath is empty.
	return node
}

// Given a tree, obtain a dictionary of blobs.
const requestBlobsFromTree = async (
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
			const response = await fetch(blobURL, initOptions)
			const blob = await response.json()
			blobs[blobPath] = blob
		}
	}

	// Once all blobs are obtained, return them.
	// Note, the text will still be compressed in base64.
	return blobs
}

// Given a blob, obtain the text content.
const getContentFromBlob = (
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
const requestFeatureData = async () => {
	// The initial git branch can be determined by the imported variables.
	// Determine repository download URL.
	const branchURL = `https://${website}/repos/${account}/${project}/branches/${branch}`
	console.warn(branchURL)
	const response = await fetch(branchURL, initOptions)
	const branchObj = await response.json()

	// The module can make deeper calls once the branchObj is determined..
	const rootTreeObj = await requestTreeFromBranch(branchObj)
	const blobTreePath = `source/${version}/abilities/features/`
	const blobTreeObj = await requestNodeFromTree(rootTreeObj, blobTreePath)
	const blobObjDict = await requestBlobsFromTree(blobTreeObj)

	// The resulting object has a bit too much info, so I'm flattening it a bit.
	// Loop through all the blobs to consolidate the data.
	const files = {}
	const entries = Object.entries(blobObjDict)
	for (const [entryName, blobObj] of entries) {
		// Decode the blobs to just give back some text.
		const entryText = getContentFromBlob(blobObj)
		files[entryName] = entryText
	}

	// Return all the files in a Promise.
	return files
}

/* MAKE MODULE EXPORTS */
// This will be exported as a promise.
// The next module will have to await the data as normal.
export {requestFeatureData}
