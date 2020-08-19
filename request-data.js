import {githubAccessToken as token} from './env.js'

/* USE A MODULE */
// Using HTML modules, we'll import this project:
// https://github.com/octokit/graphql.js/
import {graphql} from 'https://cdn.pika.dev/@octokit/graphql'

/* PREPARE FOR REQUEST */
// We'll need three things for our request:
// - the GraphQL query that we want called
// - our GitHub Access Token
// - the Authorization Header, with our token

// If you'd like to mess around with the GitHub API, visit the GraphiQL playground here:
// https://developer.github.com/v4/explorer/
const query = `
query GetFiles {
	organization(login: "mythril-forge") {
		repository(name: "character-data") {
			object(expression: "master:source/homebrew/abilities/features") {
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

// Get your github access token at:
// https://github.com/settings/tokens
const authorization = {
	headers: {
		authorization: 'token ' + token
	}
}

/* CREATE THE FUNCTION */
// Create an async function to make the request.
const getFileData = async (query, authorization) => {
	// The the request is made when graphql is called.
	const result = await graphql(query, authorization)
	const entries = await result.organization.repository.object.entries
	// Loop through all the entries to consolidate the data.
	const files = {}
	for (const entry of entries) {
		const entryName = entry.name
		const entryText = entry.object.text
		if (entryText !== undefined) {
			files[entryName] = entryText
		}
	}
	// Return the files in a Promise.
	return files
}

/* STEP 4: USE THE FUNCTION */
// This will resolve the promise and print it to console.
// You can expand the objects and subobjects to see data.
export const fileData = getFileData(query, authorization)
