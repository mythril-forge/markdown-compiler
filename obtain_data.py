from functools import reduce
from zipfile import ZipFile
from io import BytesIO
import requests
import json
import os
import re



def collect_features():
	'''
	This is the root of every function presented here.
	If there is no data, it will download the JSON data.
	Otherwise, it will simply use the JSON data on-file.
	This function then returns a python object of that data.
	---
	This function is specifically designed for class features.
	'''
	# Set hardcoded repository information.
	references = {
		'website': 'github.com',
		'account': 'mythril-forge',
		'project': 'character-data',
		'branch': 'dev',
		'version': 'homebrew',
	}
	redownload = False

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

	# Determine feature data directory reference.
	features_dir = download_dir
	features_dir += 'source/'
	features_dir += f'{references["version"]}/'
	features_dir += 'abilities/features/'

	if redownload or not os.path.isdir(download_dir):
		# Download a zip of the data repository; extract it.
		req = requests.get(download_url, stream=True)
		zip = ZipFile(BytesIO(req.content))
		zip.extractall('./downloads/')

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
		feature_data['description_template'] = template
		# Add to features dictionary.
		features[feature_name] = feature_data

	# Return populated features dictionary.
	return features
