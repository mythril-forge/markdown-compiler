def compose_class_features(features):
	'''
	This will take in the features dataset.
	Each feature in the dataset will be categorized by class.
	A feature can be a part of zero or many classes.
	For example, a few classes get the Expertise feature.
	However, no class explicitly gets the Dueling feature.
	The compiled collection of categorized features returns.
	---
	Each feature listed is a pointer to the features dataset.
	This collection of data works reliably with memory.
	'''
	# Create base class_features dictionary object.
	class_features = {} # *this will be returned later*

	# Loop through all given features.
	# Each feature may exist for zero or many classes.
	# This works fine in memory;
	# 	many classes' entries may point to the same feature.
	for feature_name, feature in features.items():
		for class_name in feature.get('classes', {}):
			if 'progression' in feature['classes'][class_name]:
				if class_name not in class_features:
					class_features[class_name] = {}
				class_features[class_name][feature_name] = feature

	# Return populated class_features dictionary.
	return class_features



def compose_class_progressions(class_features):
	'''
	This takes in compiled class_features.
	By looping through each class and feature, this function
	is able to create a table for players to use as an index.
	By default, the progression table will be sorted by level.
	Each class has a progression table, and each get returned.
	'''
	# Create a sorted_class_features dictionary object.
	# Also create a class_progression dictionary object.
	sorted_class_features = {}
	class_progressions = {} # *this will be returned later*


	# Loop through each and every class_name.
	for class_name in class_features:
		# Initialize empty array to hold class progression rows.
		# Each row will have a distinct level.
		# ---
		# An object or dictionary could have been used, but...
		# This data will be ported over to JSON.
		# JSON doesn't support integer keys. I don't like that.
		class_progression = []
		class_progressions[class_name] = class_progression
		for level in range(1, 21):
			class_progression.append({
				'Level': level,
				'Features': [],
			})

		# Create an array of class features, sorted by names.
		# These only contain certain features; specifically, the
		# 	ones for this class that appear in the progression.
		sorted_features = class_features[class_name].values()
		sorted_features = list(sorted_features)
		sorted_features.sort(key = lambda x: x['slug'])

		# Loop through each sorted feature's data, in order.
		for feature in sorted_features:

			# Here, progression is short for feature progression.
			# 	(rather than the whole class progression)
			progression = \
				feature['classes'][class_name]['progression']

			# Each row in the progression dictionary should
			# 	already be sorted numerically by levels.
			# Even so, it may be safer to just re-sort it here.
			progression.sort(key = lambda x: x['Level'])

			# Loop through each row of this feature's progression.
			# Each feature has a progression that should be added
			# 	to the entire class progression table.
			for row in progression:
				level = row['Level']
				for column, value in row.items():

					# "Level" already exists in all rows.
					if column == 'Level':
						pass

					elif column == 'Feature':
						# Filter the entry whose level is equal.
						filterer = lambda row: row['Level'] == level
						[entry] = [*filter(filterer, class_progression)]
						# Once we have this entry, we can add to it.
						# Notice Features is plural, denoting an array.
						entry['Features'].append(value)

					else:
						# The column is custom (not a Level or Feature).
						# We have to loop through every level of entry.
						# If it hasn't been added, add it with None.
						# If the level is valid, replace it with value.
						for entry in class_progression:
							if column not in entry:
								entry[column] = None
							if entry['Level'] >= row['Level']:
								entry[column] = value

		# Revert and sort class progresions
		class_progression.sort(key = lambda row: row['Level'])
		class_progressions[class_name] = class_progression

	# All class progressions have been completely filled.
	return class_progressions
