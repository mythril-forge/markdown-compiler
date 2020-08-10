from helpers import ordinal



def generate_summaries(class_features, class_progressions):
	for class_name in class_features:
		progression = class_progressions[class_name]
		generate_summary_table(progression)



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

	markdown += '<table><thead><tr>'
	for column in columns:
		if column in grouped_columns:
			column_span = len(grouped_columns[column])
			row_span = 1
		else:
			column_span = 1
			row_span = 2
		markdown += '<th '
		markdown += f'colspan="{column_span}" '
		markdown += f'rowspan="{row_span}">'
		markdown += column
		markdown += '</th>'
	markdown += '</tr>'

	if len(grouped_columns) > 0:
		markdown += '<tr>'
		for column in columns:
			for subcolumn in grouped_columns.get(column, {}):
				markdown += '<th '
				markdown += 'colspan="1" '
				markdown += 'rowspan="1">'
				markdown += subcolumn
				markdown += '</th>'
		markdown += '</tr>'
	markdown += '<tbody>'

	for row in progression:
		markdown += '<tr>'
		entries = []
		for column, entry in row.items():
			if isinstance(entry, dict):
				flag = False
				for item in entry.values():
					flag = True
					if item is None: item = '&mdash;'
					markdown += f'<td>{str(item)}</td>'
				if not flag:
					markdown += f'<td>&mdash;</td>'
			else:
				if isinstance(entry, list):
					entry = ', '.join(entry)
					if entry == '': entry = '&mdash;'
				if isinstance(entry, int):
					entry = ordinal(entry)

				if entry is None: entry = '&mdash;'
				markdown += f'<td>{entry}</td>'

		markdown += '</tr>'
	markdown += '</tbody>'
	markdown += '</table>'

	input(markdown)
	return markdown
