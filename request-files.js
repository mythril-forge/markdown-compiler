/* IMPORT LOCAL & REMOTE MODULES  */
// Using HTML modules, we'll import this project:
// https://github.com/octokit/graphql.js/
import {graphql} from 'https://cdn.pika.dev/@octokit/graphql'
import {githubAccessToken as token} from './env.js'

// Define variables to collect data.
const {
	website,
	account,
	project,
	branch,
	version,
} = {
	'website': 'github.com',
	'account': 'mythril-forge',
	'project': 'character-data',
	'branch': 'dev',
	'version': 'homebrew',
}

/*
	The files requested here are the root of all the data.
	Every function presented here uses this data.
	Then, we return a JavaScript object of all those files.
	---
	These functions are specifically designed for class & feature files.
	'''
*/

/* DECLARE AUTHORIZATION */
// Get your github access token at:
// https://github.com/settings/tokens
const authorization = {
	headers: {
		authorization: 'token ' + token
	}
}
/* PREPARE FOR GRAPHQL REQUEST */
// This GraphQL query is where the magic happens.
// Intead of hitting multiple endpoints, there is only one!
// If you'd like to mess around with the GitHub API, visit the GraphiQL playground here:
// https://developer.github.com/v4/explorer/
const query = `
query GetFiles {
	organization(login: "${account}") {
		repository(name: "${project}") {
			object(expression: "${branch}:source/${version}/abilities/features") {
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
const requestFeatureFiles = async () => {
	// The request is made when graphql is called.
	const result = await graphql(query, authorization)
	const entries = await result.organization.repository.object.entries

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

/* MAKE MODULE EXPORTS */
// This will resolve the promise and print it to console.
// You can expand the objects and subobjects to see data.
export {requestFeatureFiles}

/* SAMPLE OUTPUT */
(async () => {
	// Obtain all features and classes, ever.
	let featureFiles = requestFeatureFiles()
	// let classFiles = requestClassFiles()
	featureFiles = await featureFiles
	// classFiles = await classFiles

	// Output results to console.
	console.dir(featureFiles)
})()
