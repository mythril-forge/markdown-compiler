


const ordinal = (level) => {
	/*
	INPUT: integer
	OUTPUT: string
	---
	an ordinal is human-readable for the nth-ID of something.
	1st, 2nd, 3rd, 4th, 5th, etc. are all ordinals.
	*/

	// if there is a number, such or 511 or 13, it cant have
	// a "special" ordinal (1st; 3rd) because it is a "teen".
	if (Math.floor(level % 100 / 10) === 1) {
		return level.toString() + 'th'
	}

	// otherwise, if a number ends in 1, 2, or 3, then
	// it must have a special ordinal (-st, -nd, -rd).
	else if (level % 10 === 1) {
		return level.toString() + 'st'
	}
	else if (level % 10 === 2) {
		return level.toString() + 'nd'
	}
	else if (level % 10 === 3) {
		return level.toString() + 'rd'
	}
	// in all other cases, use the default ordinal (-th).
	else {
		return level.toString() + 'th'
	}
}
// read levels into markdown
const readLevels = (...levels) => {
	/*
	INPUT: one or more integer(s)
	OUTPUT: string
	---
	the levels given by json are data, but they aren't parsed
	for the markdown. this function does the parsing work.
	*/

	// declare useful generator
	function *generator () {
		for (const level of levels) {
			yield ordinal(level)
		}
	}
	const level = generator()

	// enforce valid output.
	if (levels.length <= 0) {
		throw new Error('invalid length')
	}

	if (levels.length === 1) {
		return (
			`${level.next().value} level`
		)
	}
	else if (levels.length === 2) {
		return (
			`${level.next().value} level and again at ${level.next().value} level`
		)
	}
	else if (levels.length === 3) {
		return (
			`${level.next().value} level and again at ${level.next().value} and ${level.next().value} level`
		)
	}
	else {
		text = (
			`${level.next().value} level and again at ${level.next().value}, `
		)

		// represent repeated level-list text.
		const intermediate = []
		let nextLevel = level.next()
		while (!nextLevel.done) {
			intermediate.push(nextLevel.value)
			nextLevel = level.next()
		}
		const finalLevel = intermediate.pop()
		for (const nextLevel of intermediate) {
			text += `${nextLevel}, `
		}

		// but also, represent the last level text,
		// and mark end of list with a conjunction.
		text += `and ${finalLevel} level`
		return text
	}
}

export {ordinal, readLevels}
