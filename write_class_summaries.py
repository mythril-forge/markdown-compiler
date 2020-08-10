import re
import json
from string import ascii_lowercase as alphabet
from helpers import ordinal



def generate_summaries(class_features, class_progressions, all_classes):
	results = {}
	for class_name in all_classes:
		features = class_features[class_name]
		class_data = all_classes[class_name]
		markdown = ''

		markdown += explain_class_data(class_data, class_name)

		progression = class_progressions[class_name]
		markdown += generate_summary_table(progression)
		markdown += summarize(features, class_name)

		results[class_name] = markdown



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
	markdown = ''
	features = [*features.values()]
	features.sort(key = lambda feature: feature['classes'][class_name]['progression'][0].get('Feature', ''))
	features.sort(key = lambda feature: feature['classes'][class_name]['progression'][0]['Level'])
	for feature in features:
		markdown += feature['classes'][class_name]['description']
		markdown += '\n'
	return markdown


def explain_class_data(class_data, class_name):
	hit_dice = class_data['Hit Dice']

	def get_average_die(dice):
		expression = r'\d+(?=d)'
		dice_count = int(re.search(expression, dice).group())
		expression = r'(?<=d)\d+'
		dice_size = int(re.search(expression, dice).group())
		dice_size = 1 + (dice_size // 2)
		total = dice_count * dice_size
		return str(total)

	avg_dice = get_average_die(hit_dice)

	markdown = ''
	# Start with hit dice.
	markdown += f'# {class_name}'
	markdown += '\n## Hit Points'
	markdown += '\n- **Hit Dice:** '
	markdown += f'{hit_dice}'
	markdown += '\n- **Hit Points per Level:** '
	markdown += f'{hit_dice} (reroll 1\'s, or take {avg_dice}) + constitution modifier'


	def parse_proficiency(prof_type):
		add_text = ''
		if len(prof_type) == 0:
			return add_text
		for prof in prof_type:
			if prof['choose'] is None:
				add_text += ''
			else:
				add_text += f'Choose {prof["choose"]} from '
			add_text += ', '.join(prof['selection'])
			add_text += '.'
		return add_text

	# Next, parse proficiencies.
	profs = class_data['Starting Out']['Proficiencies']
	markdown += '\n\n## Proficiencies'
	all_profs = ['Armor', 'Weapons', 'Saving Throws', 'Skills', 'Tools', 'Languages']

	for these_profs in all_profs:
		if len(profs[these_profs]) > 0:
			markdown += '\n'
			markdown += f'- **{these_profs}:** '
			markdown += parse_proficiency(profs[these_profs])

	# Starting Equipment
	markdown += '\n\n## Starting Equipment'
	markdown += '\nYou start with the following items, plus anything provided by your background.'
	starter_equipment = class_data['Starting Out']['Starting Equipment']
	for item_groups in starter_equipment:
		if item_groups['choose'] == None:
			markdown += f"\n- {', '.join(item_groups['selection'])}"
		else:
			markdown += '\n-'
			loops = 0
			for item in item_groups['selection']:
				x = alphabet[loops]
				if isinstance(item, list):
					markdown += f' ({x}) '
					markdown += ', '.join(item)
				else:
					markdown += f' ({x}) '
					markdown += item
				loops += 1

	initial_funds = f'\n- {class_data["Starting Out"]["Initial Funds"]} silver pieces'
	markdown += initial_funds

	# Multiclassing stufff
	markdown += '\n\n## Multiclassing'
	markdown += "\nWhen you gain a level in a class other than your first, you gain only some of that class's starting proficiencies."
	markdown += '\n- **Prerequisites:**'
	for item, value in class_data['Multiclassing']['Prerequisites'].items():
		markdown += '\n\t' + f'- **{item}:** {value}'

	profs = class_data['Multiclassing']['Proficiencies']
	all_profs = ['Armor', 'Weapons', 'Saving Throws', 'Skills', 'Tools', 'Languages']
	for these_profs in all_profs:
		if len(profs[these_profs]) > 0:
			markdown += '\n'
			markdown += f'- **{these_profs}:** '
			markdown += parse_proficiency(profs[these_profs])
	# for item, value
	return markdown
