/* OBTAIN CODE IMPORTS */
// The env.js file is a placeholder for .env in vanilla javascript.
// It holds my GitHub access token, so its added to my project's .gitignore.
import {githubAccessToken as token} from './env.js'

/* SET UP VARIABLES */
// Get your github access token at:
// https://github.com/settings/tokens
const fetchInit = {
	headers: {
		authorization: 'token ' + token
	}
}

// Set up various URL subpaths.
const endpoint = 'api.github.com'
const account = 'mythril-forge'
const project = 'character-data'
const branch = 'master'
const version = 'homebrew'

/* MAKE MODULE EXPORTS */
// Export the various variables made in this file.
export {
	fetchInit,
	endpoint,
	account,
	project,
	branch,
	version
}
