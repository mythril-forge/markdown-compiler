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



# look to parse markdown text.
# there are several "tags" in the text.
# they look like this: {@tag} or {@tag some strings}
def parse_metadata(text, levels=None):
	tag = re.search(r'{@.*?(?= |})', text)
	if tag is None:
		# There are no special tags in the text.
		return text

	# Split left, middle, and right based on tag result.
	# The tag is the middle, but we will be deleting it.
	left_text = text[:tag.span()[0]]
	right_text = text[tag.span()[1]:]
	tag = tag.group()[2:]

	# Recursively clean the right side of the text first.
	# This takes care of any nested text-tagging.
	right_text = parse_metadata(right_text, levels)

	# Since the right text is cleaned, we can safely find
	# text leading to the next available closing brace.
	middle_text = re.search(r'.*?(?=})', right_text)
	right_text = right_text[middle_text.span()[1] + 1:]
	middle_text = middle_text.group()

	# == NOTE ==
	# Now there are four variables.
	# 1. tag
	# 2. left_text
	# 3. right_text
	# 4. middle_text

	# # Print debugging =^_^=
	# print('\n== DATA ==')
	# print('left:', left_text)
	# print('right:', right_text)
	# print('center:', middle_text)
	# print('tag:', tag)

	# # Remove "*", "`", and "_" from middle_text & tag.
	# middle_text = re.sub(r'(\*|`|_)+', '', middle_text)
	# tag = re.sub(r'(\*|`|_)+', '', tag)

	if tag == 'levels':
		middle_text = read_levels(*levels)
		# Actions are italicized.
		# middle_text = f'*{middle_text}*'

	elif tag == 'level':
		middle_text = read_levels(levels.pop())

	else:
		print('\n== EXCEPTION ==')
		print('left:', left_text)
		print('right:', right_text)
		print('center:', middle_text)
		print('tag:', tag)
		input()
		raise Exception(tag)

	# Return post-formatted text.
	return left_text + middle_text + right_text



if __name__ == '__main__':
	print(parse_metadata('at {@level} and {@level}', [1,2,3,4]))
