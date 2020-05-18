# downloaded pip libraries
import time
import requests
from slugify import slugify
# internal libraries
from helpers import parse_metadata


class CharacterClass:
	def __init__(self, char_class):

		# Set character class
		self.char_class = char_class

		# Set hardcoded repository information.
		self.references = {
			'website': 'raw.githubusercontent.com',
			'account': 'mythril-forge',
			'repository': 'homebrew-class-data',
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
		class_url += 'source/vocations/classes/'
		class_url += f'{self.char_class}/'

		# Determine features URL.
		features_url = repo_url
		features_url += 'source/abilities/features/'

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

		# Determine changelog metadata URL.
		changelog_url = features_url
		changelog_url += 'metadata/changelog.json'
		changelog_res = requests.get(changelog_url)
		if changelog_res.status_code == 200:
			changelog = changelog_res.json()

		# Determine changelog metadata URL.
		options_url = features_url
		options_url += 'metadata/options.json'
		options_res = requests.get(options_url)
		if options_res.status_code == 200:
			options = options_res.json()

		# Gather items into a single data object.
		self.data = {
			'analogues': analogues,
			'changelog': changelog,
			'foundation': foundation,
			'progression': progression,
			'options': options,
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

		# Here, "visited" stores features that have been seen.
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
		markdown = parse_metadata(markdown, progression[:])

		# Trim excess new-lines and spaces.
		markdown = markdown.strip()
		markdown += '\n\n'
		markdown = markdown.replace('# ', '## ')

		# Return fully-compiled markdown.
		return markdown


# here is an example of the app in use.
if __name__ == "__main__":
	# currently only fighter data exists!
	# its not that it won't work with other classes,
	# its just that the other classes do not exist.
	fighter = CharacterClass("fighter")
	# this app prints the markdown features of a fighter.
	print(fighter)
