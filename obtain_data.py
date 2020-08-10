from functools import reduce
from zipfile import ZipFile
from io import BytesIO
import requests
import json
import os
import re



def collect_data(
	references = {
		'website': 'github.com',
		'account': 'mythril-forge',
		'project': 'character-data',
		'branch': 'dev',
		'version': 'homebrew',
	},
	redownload = True,
):
	'''
	This is the root of every function presented here.
	If there is no data, it will download the JSON data.
	Otherwise, it will simply use the JSON data on-file.
	This function then returns a python object of that data.
	---
	This function is specifically designed for class features.
	'''
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

			'''
			# Get markdown description template.
			filepath = classes_dir + class_name + '.md'
			with open(filepath) as file:
				template = file.read()

			# Combine for full class data summary.
			class_data['desc_template'] = template
			'''

			# Add to classes dictionary.
			classes[class_name] = class_data

		# Return populated classes dictionary.
		return classes

	classes = collect_classes()
	features = collect_features()
	return classes, features
