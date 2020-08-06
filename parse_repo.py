from functools import reduce
from zipfile import ZipFile
from io import BytesIO
import requests
import json
import os
import re



def collect_features():
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

		# Get markdown template.
		filepath = features_dir + feature_name + '.md'
		with open(filepath) as file:
			template = file.read()

		# Combine for full feature data summary.
		feature_data['template'] = template
		# Add to features dictionary.
		features[feature_name] = feature_data

	# Return populated features dictionary.
	return features



def compose_features_by_class(features):
	# Create base class_features dictionary object.
	class_features = {} # *this will be returned later*

	# Loop through all given features.
	# Each feature may exist for zero or many classes.
	# This works fine in memory;
	# many classes' entries may point to the same feature.
	for feature_name, feature_data in features.items():
		for class_name in feature_data.get('classes', {}):
			class_info = feature_data['classes'][class_name]
			if 'progression' in class_info:
				if class_name not in class_features:
					class_features[class_name] = {}
				class_features[class_name][feature_name] = feature_data

	# Return populated class_features dictionary.
	return class_features



def compose_class_progressions(features, class_features):
	# Create a sorted_class_features dictionary object.
	# Also create a class_progression dictionary object.
	sorted_class_features = {}
	class_progressions = {} # *this will be returned later*


	# Loop through each and every class_name.
	for class_name in class_features:
		# Initialize empty array to hold class progression rows.
		# Each row will have a distinct level.
		# ---
		# An object or dictionary could have been used, but...
		# This data will be ported over to JSON.
		# JSON doesn't support integer keys. I don't like that.
		class_progression = []
		class_progressions[class_name] = class_progression
		for level in range(1, 21):
			class_progression.append({
				'Level': level,
				'Features': [],
			})

		# Create an array of class features, sorted by names.
		# These only contain certain features; specifically, the
		# ones for this class that appear in the progression.
		sorted_features = class_features[class_name].values()
		sorted_features = list(sorted_features)
		sorted_features.sort(key = lambda x: x['slug'])

		# Loop through each sorted feature's data, in order.
		for feature in sorted_features:

			# Here, progression is short for feature progression.
			# (rather than the whole class progression)
			class_info = feature['classes'][class_name]
			progression = class_info['progression']
			progression.sort(key = lambda x: x['Level'])

			# Loop through each row of this feature's progression.
			# They should already be sorted numerically by level.
			for row in progression:
				level = row['Level']
				for column, value in row.items():
					if column == 'Level':
						pass
					elif column == 'Features':
						filterer = lambda row: row['Level'] == level
						[entry] = [*filter(filterer, class_progression)]
						entry[column].append(value)
					else:
						for entry in class_progression:
							if column not in entry:
								entry[column] = None
							if entry['Level'] >= row['Level']:
								entry[column] = value

		# revert and sort class progresions
		class_progression.sort(key = lambda row: row['Level'])
		class_progressions[class_name] = class_progression

	return class_progressions


# These variables should be exported by themselves.
features = collect_features()
features_by_class = compose_features_by_class(features)
class_progressions = compose_class_progressions(features, features_by_class)
