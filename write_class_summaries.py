def generate_summaries(class_features, class_progressions):
	for class_name in class_features:
		progression = class_progressions[class_name]
		generate_summary_table(progression)



def generate_summary_table(progression):
	columns = []
	progression.sort(key = lambda row: row['Level'])
	for row in progression:
		for column in row:
			if column not in columns:
				columns.append(column)

	table = []
	for row in progression:
		entries = []
		for column in columns:
			entry = row.get(column, '')
			entries.append(entry)
		table.append(entries)

	markdown = ''
	for column in columns:
		markdown += f'| {column} '
	markdown += '|\n'

	for column in columns:
		markdown += '| --- '
	markdown += '|\n'

	for row in table:
		for entry in row:
			if isinstance(entry, list):
				entry = ', '.join(entry)
			if entry == '' or entry is None:
				entry = '&mdash;'
			markdown += f'| {entry} '
		markdown += '|\n'

	return markdown
