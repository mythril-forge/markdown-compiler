from helpers import read_levels
from helpers import ordinal
from functools import reduce
import re
infinity = float('inf')



def generate_descriptions(all_features):
	# Loop through all the features!
	for feature in all_features.values():
		if 'classes' in feature:
			# Loop through each class in the feature.
			for class_name in feature.get('classes', {}):
				feature_class = feature['classes'][class_name]
				markdown = make_description(feature, class_name)
				# If the feature has children, loop through them.
				for child_name in feature_class.get('children', {}):
					child = all_features[child_name]
					markdown += '\n#'
					markdown += make_description(child, class_name)
				# The markdown is complete for this feature_class!
				feature_class['markdown'] = markdown



def make_description(feature, class_name):
	markdown = feature['description_template']
	# Track each visited text-tag.
	visited_tags = []

	if 'classes' in feature:
		# Get the class data from this feature.
		feature_class = feature \
			['classes']           \
			[class_name]

		# Certain subfeatures will not have a progression.
		# Dont try to set progression in this case.
		if 'progression' in feature_class:
			# Get the progression table for this class.
			progression = feature \
				['classes']         \
				[class_name]        \
				['progression']
			# The progression table may not be sorted. Sort it!
			progression.sort(key = lambda x: x['Level'])

	# This is where the meat of the function happens.
	# Try to find a tag.
	regex_tag = get_tag(markdown)
	# Transform tags into readable text while they exist.
	while regex_tag is not None:
		# Get indices from search result.
		start, end = regex_tag.span()
		tag = regex_tag.group()[4:-4]
		left = markdown[:start]
		right = markdown[end:]
		middle = ''

		# Replace tag with designated class name.
		if tag == 'class':
			middle = class_name

		# Replace tag with a level signature.
		elif tag in ['level', 'end-levels', 'all-levels']:
			# Create and use reducer to get number of matches.
			reducer = lambda count, tag: count + (tag == 'level')
			matches = reduce(reducer, visited_tags, 0)
			# The end-levels tag means all tags are visited.
			if ('end-levels' in visited_tags): matches += infinity

			# If tag is all-levels, add all levels ever.
			if tag == 'all-levels':
				# Initialize levels for this action.
				levels = []
				# Get all the rows in this feature.
				for row in progression:
					# Get the level.
					level = row['Level']
					levels.append(level)
				# Add textified level signature ordinals.
				middle = read_levels(*levels)

			# Ensure index is in range of the progression table.
			elif matches < len(progression):

				# Add a single level.
				if tag == 'level':
					# Get the associated row.
					row = progression[matches]
					# Get the level.
					level = row['Level']
					# Add textified level signature ordinals.
					middle = read_levels(level)

				# Add multiple levels.
				elif tag == 'end-levels':
					# Initialize levels for this action.
					levels = []
					# Get all the remaining unvisted rows.
					for row in progression[matches:]:
						# Get the level.
						level = row['Level']
						levels.append(level)
					# Add textified level signature ordinals.
					middle = read_levels(*levels)

			# Delete the line if level is out of range.
			else:
				# Get expressions.
				left_expression =  r'(^|\n).*?$'
				right_expression = r'^.*?(\n|$)'
				# Get spans.
				end, _ = re.search(left_expression, left).span()
				_, start = re.search(right_expression, right).span()
				# Delete line.
				left = left[:end]
				right = right[start:]
				middle = '\n'

		# Replace tag with a level signature plurality.
		elif tag == 'levels':
			# Create reducer.
			reducer = lambda list, row: [*list, row['Level']]
			# Use reducer to obtain all levels.
			levels = reduce(reducer, progression, [])
			# Add textified level signature ordinals.
			middle = read_levels(*levels)

		elif tag in feature_class.get('variables', {}):
			middle = feature_class['variables'][tag]

		# Tag is malformed.
		else:
			raise ValueError(tag)

		# Include this processed tag.
		visited_tags.append(tag)
		# Update markdown.
		markdown = left + middle + right
		# Check next tag.
		regex_tag = get_tag(markdown)

	# Return newly cleaned markdown.
	return markdown



# Helper function.
def get_tag(markdown):
	expression = r'`\{\( .+? \)\}`'
	return re.search(expression, markdown)
