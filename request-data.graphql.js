/* OBTAIN CODE IMPORTS */
// Using HTML modules, we'll import this project:
// https://github.com/octokit/graphql.js/
import {graphql} from 'https://cdn.skypack.dev/@octokit/graphql'

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

/* PREPARE FOR GRAPHQL REQUEST */
// This GraphQL query is where the magic happens.
// Intead of hitting multiple endpoints, there is only one!
// If you'd like to mess around with the GitHub API, visit the GraphiQL playground here:
// https://developer.github.com/v4/explorer/

// Determine repository download URL.
const endpoint = `https://${website}/graphql`

// Determine downloaded file reference.
const query = `
query GetFiles {
	organization(login: "${account}") {
		repository(name: "${project}") {
			classes: object(expression: "${branch}:source/${version}/vocations/classes") {
				... on Tree {
					entries {
						name
						object {
							... on Blob {
								text
							}
						}
					}
				}
			}
			features: object(expression: "${branch}:source/${version}/abilities/features") {
				... on Tree {
					entries {
						name
						object {
							... on Blob {
								text
							}
						}
					}
				}
			}
		}
	}
}
`

/* CREATE THE DATA COLLECTOR */
// This response immediately prepped and requested once.
// It should be either pending or done each time its called.
let response = null

// Create async functions to make the request.
// Once the GraphQL response is processed they wont need to await.

const requestClassData = async () => {
	// Obtain response data from the GraphQL request.
	response ??=  graphql(query, initOptions)
	const data = await response

	// Select specific classes property, process, and return.
	const entries = data['organization']['repository']['classes']['entries']
	return processData(entries)
}

const requestFeatureData = async () => {
	// Obtain response data from the GraphQL request.
	response ??=  graphql(query, initOptions)
	const data = await response

	// Select specific classes property, process, and return.
	const entries = data['organization']['repository']['features']['entries']
	return processData(entries)
}

// Whatever use the response has, the data is over-structured.
// It needs to be flattened for the purposes of this app.

const processData = (entries) => {
	// The entries object is over-structured and needs flattened.
	// Create a new object and populate it with flat data.
	const files = {}
	for (const entry of entries) {
		const entryName = entry.name
		const entryText = entry.object.text

		// Some directories may exist in the results, but we don't need them.
		// To avoid adding those uneeded folders, ignore files that don't have any text.
		if (entryText !== undefined) {
			files[entryName] = entryText
		}
	}

	// Return the flattened files.
	return files
}

export {
	requestClassData,
	requestFeatureData,
}
