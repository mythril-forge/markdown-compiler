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

/*** obtain_data.py3 *********************************************************************
	# Make a copy of the references object
	# 	in case its ever changed.
	references = {**references}

	# Determine repository download URL.
	download_url = 'https://'
	download_url += f'{references["website"]}/'
	download_url += f'{references["account"]}/'
	download_url += f'{references["project"]}/'
	download_url += 'archive/'
	download_url += f'{references["branch"]}.zip'

	# Determine downloaded file reference.
	download_dir = './downloads/' # /archive-*...?
	download_dir += f'{references["project"]}-'
	download_dir += f'{references["branch"]}/'

	if redownload or not os.path.isdir(download_dir):
		# Download a zip of the data repository; extract it.
		request = requests.get(download_url, stream=True)
		zip = ZipFile(BytesIO(request.content))
		zip.extractall('./downloads/')


	def collect_features():
		# Determine feature data directory reference.
		features_dir = download_dir
		features_dir += 'source/'
		features_dir += f'{references["version"]}/'
		features_dir += 'abilities/features/'

		# Create slugs from walking the features_dir.
		# The slugs are meant to have no file extention.
		def make_slugs(feature_names, filename):
			expression = r'^(.*)(?=\.(.+))'
			feature_name = re.match(expression, filename)
			feature_names.add(feature_name.group())
			return feature_names

		# Use this reducer to create a set of all features.
		_, _, filenames = next(os.walk(features_dir))
		feature_names = reduce(make_slugs, filenames, set([]))

		# Create base features dictionary object.
		features = {} # *this will be returned later*

		# Loop through all the features.
		for feature_name in feature_names:

			# Get data.
			filepath = features_dir + feature_name + '.json'
			with open(filepath) as file:
				feature_data = json.load(file)

			# Get markdown description template.
			filepath = features_dir + feature_name + '.md'
			with open(filepath) as file:
				template = file.read()

			# Combine for full feature data summary.
			feature_data['desc_template'] = template
			# Add to features dictionary.
			features[feature_name] = feature_data

		# Return populated features dictionary.
		return features


	def collect_classes():
		# Determine feature data directory reference.
		classes_dir = download_dir
		classes_dir += 'source/'
		classes_dir += f'{references["version"]}/'
		classes_dir += 'vocations/classes/'

		# Create slugs from walking the classes_dir.
		# The slugs are meant to have no file extention.
		def make_slugs(class_names, filename):
			expression = r'^(.*)(?=\.(.+))'
			class_name = re.match(expression, filename)
			class_names.add(class_name.group())
			return class_names

		# Use this reducer to create a set of all classes.
		_, _, filenames = next(os.walk(classes_dir))
		class_names = reduce(make_slugs, filenames, set([]))

		# Create base classes dictionary object.
		classes = {} # *this will be returned later*

		# Loop through all the classes.
		for class_name in class_names:

			# Get data.
			filepath = classes_dir + class_name + '.json'
			with open(filepath) as file:
				class_data = json.load(file)

			# Get markdown description template.
			filepath = classes_dir + class_name + '.md'
			with open(filepath) as file:
				template = file.read()

			# Combine for full class data summary.
			class_data['desc_template'] = template

			# Add to classes dictionary.
			classes[class_name] = class_data

		# Return populated classes dictionary.
		return classes

	classes = collect_classes()
	features = collect_features()
	return classes, features
*****************************************************************************************/
