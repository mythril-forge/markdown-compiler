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



def craft_class_features(features):
	# Create base class_features dictionary object.
	class_features = {} # *this will be returned later*

	# Loop through all given features.
	# Each feature may exist for zero or many classes.
	# This works fine in memory;
	# many classes' entries may point to the same feature.
	for feature_name, feature_data in features.items():
		for class_name in feature_data.get('classes', {}):
			if 'progression' in feature_data['classes'][class_name]:
				if class_name not in class_features:
					class_features[class_name] = {}
				class_features[class_name][feature_name] = feature_data

	# Return populated class_features dictionary.
	return class_features



all_features = collect_features()
print(json.dumps(all_features))
input('\n---\nFeature Catalog shown above.\n---\n')
all_class_features = craft_class_features(all_features)
print(json.dumps(all_class_features))
input('\n---\nFeatures by Class shown above.\n---\n')



def craft_progression_tables(features, class_features):
	# Create a sorted_class_features dictionary object.
	# Also create a class_progression dictionary object.
	sorted_class_features = {}
	class_progression = {} # *this will be returned later*

	# Loop through each and every class_name.
	for class_name in class_features:

		# Seed the class progression.
		class_progression_columns = ['Level, Features']
		class_progression[class_name] = {}
		for level in range(1, 21):
			class_progression[class_name][level] = {
				'Level': level,
				'Features': [],
			}

		# Create an array of class features, sorted by names.
		sorted_class_data = [*class_features[class_name].values()]
		sorted_class_data.sort(key = lambda x: x['slug'])
		sorted_class_features[class_name] = sorted_class_data

		# Loop through each sorted feature, in order.
		for feature_data in sorted_class_features[class_name]:
			feature_progression = feature_data['classes'][class_name]['progression']
			# Loop through each row of this feature's progression.
			# They should already be sorted numerically by level.
			for row in feature_progression:
				level = row['Level']
				for column, value in row.items():
					if column == 'Level':
						pass
					elif column == 'Features':
						class_progression[class_name][level][column].append(value)

					# Special column (not feature or level)
					else:
						# Column doesn't exist yet, fill with empty.
						if column not in class_progression_columns:
							for entry in class_progression[class_name].values():
								entry[column] = '&mdash;'
							# Column has been visited.
							class_progression_columns.append(column)
						# Fill column data using level information.
						for entry in class_progression[class_name].values():
							if entry['Level'] >= row['Level']:
								entry[column] = value

		# revert and sort class progresions
		class_progression[class_name] = [*class_progression[class_name].values()]
		class_progression[class_name].sort(key = lambda x: x['Level'])

	return class_progression

craft_progression_tables(all_features, all_class_features)
