from functools import reduce
from zipfile import ZipFile
from io import BytesIO
import requests
import json
import os
import re

website = 'github.com'
account = 'mythril-forge'
project = 'character-data'
branch = 'dev'
data_root = f'{project}-{branch}'

def get_data_repo():
	url = (
		'https://'
		f'{website}/'
		f'{account}/'
		f'{project}/archive/'
		f'{branch}.zip'
	)
	req = requests.get(url, stream=True)
	zip = ZipFile(BytesIO(req.content))
	zip.extractall()

def collect_data():
	def make_slugs(slugs, filename):
		expression = r'^(.*)(?=\.(.+))'
		slug = re.match(expression, filename)
		slugs.add(slug.group())
		return slugs

	folder = f'{data_root}/source/homebrew/abilities/features/'
	_, _, filenames = next(os.walk(folder))
	slugs = reduce(make_slugs, filenames, set([]))

	# create a features dictionary, and populate it
	features = {}
	for slug in slugs:
		# get metadata
		with open(folder + slug + '.json', 'r') as file:
			metadata = json.load(file)
		# get markdown
		with open(folder + slug + '.md', 'r') as file:
			markdown = file.read()
		# combine for full feature data
		feature = {
			'markdown': markdown,
			'metadata': metadata,
		}
		# add to features dictionary
		features[slug] = feature

	# return populated features dictionary
	return features

# Step 1: Obtain data.
get_data_repo()
features = collect_data()

def compile_progression(character_class):
	def is_class_feature(slug):
		# using the slug, look up feature in features.
		feature = features[slug]
		metadata = feature['metadata']
		# determine if the feature specificies this class.
		if 'classes' in metadata:
			if character_class in metadata['classes']:
				# determine if the feature has any progression.
				class_metadata = metadata['classes'][character_class]
				if 'progression' in class_metadata:
					return True
		# failed one of the determinations.
		return False

	# class features are a list of slugs.
	# they can be used for easy lookup with features.
	class_features = filter(is_class_feature, features)

	# the class table is for user indexing.
	# its usually shown at the front of the class description.
	class_table = {}
	for level in range(1, 21):
		class_table[level] = {
			'Features': [],
		}
	table_columns = ['Level', 'Features']

	# loop through all class features.
	for slug in class_features:
		feature = features[slug]
		# the progression is whats important for the table.
		progression = feature['metadata']['classes'][character_class]['progression']
		progression = sorted(progression, key = lambda x: x['Level'])
		# each container has data on the level.
		for container in progression:
			for column, value in container.items():
				if column == 'Level':
					pass
				elif column == 'Features':
					class_table[container['Level']][column].append(value)
				else:
					# special column (not feature or level)
					if column not in table_columns:
						for level in range(1, 21):
							class_table[level][column] = '&mdash;'
						table_columns.append(column)
					for level in range(container['Level'], 21):
						class_table[level][column] = value
	print(json.dumps(class_table))

# cleric
# rogue
# fighter
# wizard
compile_progression('fighter')
