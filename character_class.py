# downloaded pip libraries
import time
import requests
import re
from slugify import slugify
# internal libraries
from helpers import read_levels


class CharacterClass:
	def __init__(self, char_class, version='homebrew'):

		# Set character class
		self.char_class = char_class
		self.version = version

		# Set hardcoded repository information.
		self.references = {
			'website': 'raw.githubusercontent.com',
			'account': 'mythril-forge',
			'repository': 'character-data',
			'branch': 'dev'
		}

		# Determine repository URL.
		repo_url = 'https://'
		repo_url += f'{self.references["website"]}/'
		repo_url += f'{self.references["account"]}/'
		repo_url += f'{self.references["repository"]}/'
		repo_url += f'{self.references["branch"]}/'

		# Determine class URL.
		class_url = repo_url
		class_url += 'source/'
		class_url += f'{self.version}/'
		class_url += 'vocations/classes/'
		class_url += f'{self.char_class}/'

		# Determine features URL.
		features_url = repo_url
		features_url += 'source/'
		features_url += f'{self.version}/'
		features_url += 'abilities/features/'

		# Gather items into a single urls object.
		self.urls = {
			'repository': repo_url,
			'features': features_url,
			'class': class_url,
		}

		# Determine foundation metadata URL.
		foundation_url = class_url
		foundation_url += 'metadata/foundation.json'
		foundation_res = requests.get(foundation_url)
		if foundation_res.status_code == 200:
			foundation = foundation_res.json()

		# Determine progression metadata URL.
		progression_url = class_url
		progression_url += 'metadata/progression.json'
		progression_res = requests.get(progression_url)
		if progression_res.status_code == 200:
			progression = progression_res.json()

		# Determine analogues metadata URL.
		analogues_url = features_url
		analogues_url += 'metadata/analogues.json'
		analogues_res = requests.get(analogues_url)
		if analogues_res.status_code == 200:
			analogues = analogues_res.json()

		# Determine options metadata URL.
		options_url = features_url
		options_url += 'metadata/options.json'
		options_res = requests.get(options_url)
		if options_res.status_code == 200:
			options = options_res.json()

		# # Determine changelog metadata URL.
		# changelog_url = features_url
		# changelog_url += 'metadata/changelog.json'
		# changelog_res = requests.get(changelog_url)
		# if changelog_res.status_code == 200:
		# 	changelog = changelog_res.json()

		# Gather items into a single data object.
		self.data = {
			'analogues': analogues,
			'foundation': foundation,
			'progression': progression,
			'options': options,
			# 'changelog': changelog,
		}

	def __repr__(self):
		return self.compose_all_markdown_features()

	def collect_progression_headers(self):
		headers = set()
		for row in self.data['progression']:
			for key in row:
				headers.add(key)

		# deconstruct set into array & return.
		return [*headers]


	def collect_feature_progression(self):

		# this collection will be used to store features as keys,
		# and their respective progression levels as values.
		feature_progression = {}
		for row in self.data['progression']:

			# gather features & level from data-row.
			level = row['Level']
			for feature in row['Features']:

				# update feature if it exists as an analogue.
				if feature in self.data['analogues']:
					feature = self.data['analogues'][feature]

				# add feature to resulting collection.
				if feature in feature_progression:
					feature_progression[feature].append(level)
				else:
					feature_progression[feature] = []
					feature_progression[feature].append(level)

		# after looping over every level and every feature,
		# all features will be added at their respective levels.
		return feature_progression



	def collect_column_widths(self):

		# This collection stores features as keys,
		# representing entire columns.
		# The values are character counts.
		column_widths = {}

		# loop through all the headers
		headers = self.collect_progression_headers()
		for header in headers:
			column_widths[header] = 3

			# track if header is large already.
			if len(header) > 3:
				column_widths[header] = len(header)

			# check the rest of the column for longer text.
			for row in self.data['progression']:
				# == TODO ==
				# determine length of data from string-entries.
				# arrays and integers are no good for this...
				pass
		return column_widths



	def compose_markdown_progression_table(self):
		pass


	def compose_markdown_foundation(self):
		pass


	def compose_all_markdown_features(self):
		feature_progression = self.collect_feature_progression()

		# Initialize emtpy markdown to return.
		markdown = ''

		# Here, 'visited' stores features that have been seen.
		visited = set([])

		# Loop through all character levels, and all features.
		for level in range(1, 21):
			for feature in feature_progression:
				progression = feature_progression[feature]

				# Check if level is right and feature is new.
				if level in progression and feature not in visited:
					visited.add(feature)

					# add this data to markdown.
					markdown += self.compose_markdown_feature(feature, progression)

		# Trim excess new-lines and spaces.
		markdown = markdown.strip()
		markdown += '\n'

		# Return fully-compiled markdown.
		return markdown


	def compose_markdown_feature(self, feature, progression):

		# Generate a sluggy.
		slug = feature.replace('\'','')
		slug = slugify(slug)

		# Determine feature URL from slug.
		feature_url = self.urls['features']
		feature_url += 'markdown/'
		feature_url += f'{slug}.md'
		feature_res = requests.get(feature_url)
		if feature_res.status_code == 200:
			markdown = feature_res.text

		# Check if this ability has any sub-options.
		# if there are options...
		markdown += '\n'
		if feature in self.data['options']:
			options = self.data['options'][feature]
			for option in options:
				markdown += self.compose_markdown_feature(option, progression)

		# Parse embedded metadata tags.
		markdown = self.parse_metadata(markdown, feature, progression)

		# Trim excess new-lines and spaces.
		markdown = markdown.strip()
		markdown += '\n\n'
		markdown = markdown.replace('# ', '## ')

		# Return fully-compiled markdown.
		return markdown


	# look to parse markdown text.
	# there are several "tags" in the text.
	# they look like this: {@tag} or {@tag some strings}
	def parse_metadata( self, text, feature, progression, depth = 0):
		tag = re.search(r'{@.*?(?= |})', text)
		if tag is None:

			# There are no special tags in the text.
			return text

		# Split left, middle, and right based on tag result.
		# The tag is the middle, but we will be deleting it.
		left_text = text[:tag.span()[0]]
		right_text = text[tag.span()[1]:]
		tag = tag.group()[2:]

		# # == HACK ==
		# # sometimes there is a mismatch of progression versus
		# # the actual number of {@level} tags (depth).
		# # this gives index out of bounds.
		# # adding 0 works but really is bad practice.
		# progression.append(0)

		# Recursively clean the right side of the text first.
		# This takes care of any nested text-tagging.
		params = [right_text, feature, progression, depth+1]
		right_text = self.parse_metadata(*params)

		# Since the right text is cleaned, we can safely find
		# text leading to the next available closing brace.
		middle_text = re.search(r'.*?(?=})', right_text)
		right_text = right_text[middle_text.span()[1] + 1:]
		middle_text = middle_text.group()

		# == NOTE ==
		# Now there are four variables.
		# 1. tag
		# 2. left_text
		# 3. right_text
		# 4. middle_text

		# # Print debugging =^_^=
		# print('\n== DATA ==')
		# print('left:', left_text)
		# print('right:', right_text)
		# print('center:', middle_text)
		# print('tag:', tag)

		# # Remove "*", "`", and "_" from middle_text & tag.
		# middle_text = re.sub(r'(\*|`|_)+', '', middle_text)
		# tag = re.sub(r'(\*|`|_)+', '', tag)

		if tag == 'levels':
			# markdownify add all levels.
			middle_text = read_levels(*progression)

		elif tag == 'level':
			# markdownify a specific level.
			print(depth)
			print(progression)
			middle_text = read_levels(progression[depth])

		elif tag == 'class':
			# markdownify a specific level.
			middle_text = self.char_class

		else:
			print('\n== EXCEPTION ==')
			print('left:', left_text)
			print('right:', right_text)
			print('center:', middle_text)
			print('tag:', tag)
			input()
			# raise Exception('invalid tag')
			middle_text = "<<NULL ERROR>>"

		# Return post-formatted text.
		return left_text + middle_text + right_text


# here is an example of the app in use.
if __name__ == '__main__':
	# currently only fighter data exists!
	# its not that it won't work with other classes,
	# its just that the other classes do not exist.
	my_class = CharacterClass('barbarian')
	# this app prints the markdown features of a fighter.
	print(my_class)
