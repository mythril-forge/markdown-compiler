from helpers import read_levels
from helpers import ordinal
from functools import reduce
import re

inf = float('inf')

def make_descriptions(all_features, class_features):
	for class_name, features in class_features.items():
		for feature_name, feature in features.items():
			text = make_description(feature, class_name)

			# Get the class data from this feature.
			class_feature = feature \
				['classes']           \
				[class_name]

			# Get text for each child.
			for child in class_feature.get('children', {}):
				child_feature = all_features[child]
				text += '\n#'
				text += make_description(feature, class_name)

			# Set the description.
			class_feature['markdown'] = text
			print(text)


# Helper function.
def get_tag(markdown):
	expression = r'`\{\( .+? \)\}`'
	return re.search(expression, markdown)

def make_description(feature, class_name):
	markdown = feature['description_template']
	# List out the visited tags.
	visited_tags = []
	regex_tag = get_tag(markdown)

	# Get the class data from this feature.
	class_feature = feature \
		['classes']           \
		[class_name]

	# Get the progression table for this class.
	progression = feature \
		['classes']         \
		[class_name]        \
		['progression']
	# The progression table may not be sorted. Sort it!
	progression.sort(key = lambda x: x['Level'])

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
			matches += inf if ('end-levels' in visited_tags) else 0

			# Ensure index is in range of the progression table.
			if matches < len(progression):

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

				elif tag == 'all-levels':
					# Initialize levels for this action.
					levels = []
					# Get all the rows in this feature.
					for row in progression:
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

		elif tag in class_feature.get('variables', {}):
			middle = class_feature['variables'][tag]

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
