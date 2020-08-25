/* OBTAIN CODE IMPORTS */
// Using HTML modules, we'll import this project:
// https://github.com/octokit/graphql.js/
import {graphql} from 'https://cdn.pika.dev/@octokit/graphql'

import {githubAccessToken as token} from './env.js'
const references = {
	website: 'api.github.com',
	account: 'mythril-forge',
	project: 'character-data',
	branch: 'master',
	version: 'homebrew',
}

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
const endpoint = `https://${references.website}/graphql`

// Determine downloaded file reference.
const query = `
query GetFiles {
	organization(login: "${references.account}") {
		repository(name: "${references.project}") {
			object(expression: "${references.branch}:source/${references.version}/abilities/features") {
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
// Create an async function to make the request.
const requestFeatureData = async () => {

	// Create fetch initialization options object.
	const options = {
		headers: {
			authorization: 'token ' + token,
		}
	}

	// The request is made when fetch is called.
	const response = graphql(query, options)
	const data = await response
	const entries = data.organization.repository.object.entries

	// The resulting object is over-structured for my purpose, so I'm flattening it a bit.
	// Loop through all the entries to consolidate the data.
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

	// Return the files in a Promise.
	return files
}

export {requestFeatureData}
