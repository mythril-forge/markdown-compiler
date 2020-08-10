from helpers import ordinal



def generate_summaries(class_features, class_progressions):
	for class_name, features in class_features.items():
		markdown = ''
		markdown += f'# {class_name}\n'
		progression = class_progressions[class_name]
		markdown += generate_summary_table(progression)
		markdown += summarize(features, class_name)
		input(markdown)



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
