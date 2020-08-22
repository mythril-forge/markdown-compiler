import re
import json
from string import ascii_lowercase as alphabet
from helpers import ordinal



def generate_summaries(class_features, class_progressions, all_classes):
	results = {}
	for class_name in all_classes:
		features = class_features[class_name]
		class_data = all_classes[class_name]
		progression = class_progressions[class_name]

		# Progression table.
		prog_table = generate_summary_table(progression)
		prog_table = f'###### {class_name.capitalize()} Table\n' + prog_table
		# Explaination startout markdown.
		explained_intro = explain_class_data(class_data, class_name)
		# Markdown feature summary.
		feature_summary = summarize(features, class_name)

		# Markdown base.
		markdown = all_classes[class_name]['desc_template']

		expression = r'`\{\( class-features \)\}`'
		rgx = re.search(expression, markdown)
		left_end, right_start = rgx.span()
		left = markdown[:left_end]
		right = markdown[right_start:]
		middle = f'As a {class_name}, you gain the following class features.\n'
		middle += explained_intro
		middle += prog_table + '\n'
		middle += feature_summary

		markdown = left + middle + right
		markdown = re.sub(r'#{6,}', '######', markdown)
		markdown = re.sub(r'\n{2,}', '\n\n', markdown)
		results[class_name] = markdown
	return results



def generate_summary_table(progression):
	columns = []
	grouped_columns = {}
	markdown = ''
	progression.sort(key = lambda row: row['Level'])

	for row in progression:
		for column in row:
			if column not in columns:
				columns.append(column)
			if isinstance(row[column], dict):
				if column not in grouped_columns:
					grouped_columns[column] = []
				for subcolumn, entry in row[column].items():
					if subcolumn not in grouped_columns[column]:
						grouped_columns[column].append(subcolumn)

	markdown += '<table>\n\t<thead>\n\t\t<tr>'
	for column in columns:
		if column in grouped_columns:
			column_span = len(grouped_columns[column])
			row_span = 1
		else:
			column_span = 1
			row_span = 2
		markdown += '\n\t\t\t<th '
		markdown += f'colspan="{column_span}" '
		markdown += f'rowspan="{row_span}">'
		markdown += column
		markdown += '</th>'
	markdown += '\n\t\t</tr>'

	if len(grouped_columns) > 0:
		markdown += '\n\t\t<tr>'
		for column in columns:
			for subcolumn in grouped_columns.get(column, {}):
				markdown += '\n\t\t\t<th '
				markdown += 'colspan="1" '
				markdown += 'rowspan="1">'
				markdown += subcolumn
				markdown += '\n\t\t\t</th>'
		markdown += '\n\t\t</tr>'
	markdown += '\n\t<tbody>'

	for row in progression:
		markdown += '\n\t\t<tr>'
		entries = []
		for column, entry in row.items():
			if isinstance(entry, dict):
				flag = False
				for item in entry.values():
					flag = True
					if item is None: item = '&mdash;'
					markdown += f'\n\t\t\t<td>{str(item)}</td>'
				if not flag:
					markdown += f'\n\t\t\t<td>&mdash;</td>'
			else:
				if isinstance(entry, list):
					entry = ', '.join(entry)
					if entry == '': entry = '&mdash;'
				if isinstance(entry, int):
					entry = ordinal(entry)

				if entry is None: entry = '&mdash;'
				markdown += f'\n\t\t\t<td>{entry}</td>'

		markdown += '\n\t\t</tr>'
	markdown += '\n\t</tbody>'
	markdown += '\n</table>\n'

	return markdown



def summarize(features, class_name):
	# Make an array of features.
	features = [*features.values()]
	# Sort them nicely.
	features.sort(key = lambda feature: feature['classes'][class_name]['progression'][0].get('Feature', ''))
	features.sort(key = lambda feature: feature['classes'][class_name]['progression'][0]['Level'])

	# If the feature is not in the table,
	# then it doesn't get described independently.
	# It needs "parental guidance".
	def filterer(feature):
		good_to_go_flag = False
		for row in feature['classes'][class_name]['progression']:
			if 'Feature' in row:
				good_to_go_flag = True
				break
		return good_to_go_flag
	features = filter(filterer, features)

	# Add every feature to the markdown.
	markdown = ''
	for feature in features:
		markdown += feature['classes'][class_name]['description']
		markdown += '\n'
	return markdown



def explain_class_data(class_data, class_name):
	# this groups object holds various bullet-lists.
	# it will be combined later into the markdown.
	listings = {}

	# the hit dice stat is great, but we need an average too.
	hit_dice = class_data['hit-dice']
	def get_average_die(dice):
		expression = r'\d+(?=d)'
		dice_count = int(re.search(expression, dice).group())
		expression = r'(?<=d)\d+'
		dice_size = int(re.search(expression, dice).group())
		dice_size = 1 + (dice_size // 2)
		total = dice_count * dice_size
		return str(total)
	avg_dice = get_average_die(hit_dice)

	# the vitalities listing does not get the same structure.
	listing = ''
	listing += (
		'\n- **Hit Dice**'
		f'\n\t- {hit_dice} per {class_name} level'
		'\n- **Hit Points**'
		f'\n\t- {hit_dice} (reroll 1\'s, or take {avg_dice}) '
		f'+ your constitution modifier per {class_name} level'
	)
	listings['Vitality'] = listing


	def conjoin(
		words,
		conjunction='and',
		seperator_list=[]
	):
		# base case
		if len(words) < 1:
			return ''
		elif len(words) < 2:
			return words[0]

		# this generator loops through the seperator_list
		def seperator():
			for item in seperator_list:
				yield item
			while True:
				yield ''
		seperator = seperator()

		# this links up words with the seperator
		new_words = []
		for word in words:
			new_words.append(f'{next(seperator)}{word}')
		words = new_words

		# here's the main part of the function.
		final_word = words[-1]
		words = words[:-1]
		words = ', '.join(words)
		words += f' {conjunction} {final_word}'
		return words


	# create the listing objects.
	for section, section_data in class_data['structured-data'].items():
		# Create the listing string
		listing = ''
		for group_type, groupings in section_data.items():
			listing += f'\n- **{group_type}**'
			for grouping in groupings:
				items = []
				for item in grouping['selection']:
					if isinstance(item, list):
						item = conjoin(item)
					items.append(item)

				# We have our items now.
				if grouping['choose'] is None:
					items = conjoin(items)
				elif section == 'Equipment':
					seperator_list = [*map(lambda l: f'({l}) ', alphabet)]
					items = conjoin(items, 'or', seperator_list)
				elif section == 'Prerequisites':
					items = conjoin(items, 'or')
				else:
					num_choices = grouping['choose']
					items = f'choose {num_choices} from {conjoin(items, "and")}'
				listing += f'\n\t- {items}'
		listings[section] = listing
	markdown = f'''
## Prerequisites
Before you can become a {class_name}, you must fulfill some basic prerequisites.
You are not eligible to become a {class_name} if you do not fit the minimum requirements listed below.
{listings["Prerequisites"]}

## Vitality
You have a pool of hit points and hit dice, which represent your vitality.
You start with a number of hit points determined by your race.
As your level increases, so do these pools of vitality, as noted below.
{listings["Vitality"]}

## Proficiencies
You have a set of capabilities that are part and parcel to your vocation.
The following proficiencies accompany any extended by your race or background.
{listings["Proficiencies"]}

## Starting Equipment
You start with the following items, plus anything provided by your background.
{listings["Equipment"]}

## Multiclassing
Your DM might allow you to use the multiclassing rules outlined in Chapter 6.
These rules allow you to take levels in other classes when you level up.
To be eligible to take a level in another class, you must fulfill its prerequisites, as well as the prerequisites for each class in which you have a level.

When you first gain a level in a new class via multiclassing, you gain only some of that classes' starting proficiencies.
These proficiencies are listed out here for {class_name}.
{listings["Multiclassing"]}

'''
	return markdown
