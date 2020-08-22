/* OBTAIN CODE IMPORTS */
// Using HTML modules, we'll import this project:
// https://github.com/octokit/graphql.js/
import {graphql} from 'https://cdn.pika.dev/@octokit/graphql'
// These static variables are neatly stored in another file.
import {
	fetchInit as graphqlInit,
	endpoint,
	account,
	project,
	branch,
	version,
} from './variables.js'

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
	const result = await graphql(query, graphqlInit)
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
