import re



def ordinal(level):
	'''
	INPUT: integer
	OUTPUT: string
	---
	an ordinal is human-readable for the nth-ID of something.
	1st, 2nd, 3rd, 4th, 5th, etc. are all ordinals.
	'''

	# if there is a number, such or 511 or 13, it cant have
	# a "special" ordinal (1st; 3rd) because it is a "teen".
	if level % 100 // 10 == 1:
		return str(level) + 'th'

	# otherwise, if a number ends in 1, 2, or 3, then
	# it must have a special ordinal (-st, -nd, -rd).
	elif level % 10 == 1:
		return str(level) + 'st'
	elif level % 10 == 2:
		return str(level) + 'nd'
	elif level % 10 == 3:
		return str(level) + 'rd'

	# in all other cases, use the default ordinal (-th).
	else:
		return str(level) + 'th'



def read_levels(*levels):
	'''
	INPUT: one or more integer(s)
	OUTPUT: string
	---
	the levels given by json are data, but they aren't parsed
	for the markdown. this function does the parsing work.
	'''

	# declare useful generator
	def generator():
		for level in levels:
			yield ordinal(level)
	level = generator()

	# enforce valid output.
	assert(len(levels) > 0)

	if len(levels) == 1:
		return (
			f'{next(level)} level'
		)
	elif len(levels) == 2:
		return (
			f'{next(level)} level ' \
			f'and again at {next(level)} level'
		)
	elif len(levels) == 3:
		return (
			f'{next(level)} level ' \
			f'and again at {next(level)} ' \
			f'and {next(level)} level'
		)
	else:
		text = (
			f'{next(level)} level ' \
			f'and again at {next(level)}, '
		)

		# represent repeated level-list text.
		*intermediate, final_level = level
		for next_level in intermediate:
			text += (f'{next_level}, ')

		# but also, represent the last level text,
		# and mark end of list with a conjunction.
		text += (f'and {final_level} level')
		return text
