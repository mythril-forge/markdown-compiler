import {RegExX} from './reg-exx.js'
import {alphabet} from './helpers'



const generateSummaries = (
	classFeatures,
	classProgressions,
	allClasses
) => {
	const results = {}
	for (const className of allClasses) {
		const features = classFeatures[className]
		const classData = allClasses[className]
		const progression = classProgressions[className]

		// Progression table.
		let progTable = generateSummaryTable(progression)
		progTable = `###### ${className.capitalize()} Table\n` + progTable
		// Explaination startout markdown.
		const explainedIntro = explainClassData(classData, className)
		// Markdown feature summary.
		const featureSummary = summarize(features, className)

		// Markdown base.
		let markdown = allClasses[className]['descTemplate']

		const expression = /`\{\( class-features \)\}`/
		const tagSearch = new RegExX(expression, markdown)
		const [leftEnd, rightStart] = tagSearch.span
		const left = markdown[:leftEnd]
		const right = markdown[rightStart:]
		let middle = `As a {className}, you gain the following class features.\n`
		middle += explainedIntro
		middle += progTable + '\n'
		middle += featureSummary

		markdown = left + middle + right
		markdown = markdown.replace(/#{6,}/, '######', markdown)
		markdown = markdown.replace(/\n{2,}/, '\n\n', markdown)
		results[className] = markdown
	}
	return results
}



const generateSummaryTable = (progression) => {
	const columns = []
	const groupedColumns = {}
	let markdown = ''
	progression.sort((a, b) => {
		if (a === b) {
			return 0
		}
		else if (a.Level > b.Level) {
			return 1
		}
		else if (a.Level < b.Level) {
			return -1
		}
		else {
			return 0
		}
	})

	for (const row of progression) {
		for (const column of row) {
			if (!(column in columns)) {
				columns.push(column)
			}
			if ((row[column] instanceof Object) && !(row[column] instanceof Array)) {
				if (!(column in groupedColumns)) {
					groupedColumns[column] = []
				}
				for (const [subcolumn, entry] of Object.entries(row[column])) {
					if (!groupedColumns[column].includes(subcolumn)) {
						groupedColumns[column].push(subcolumn)
					}
				}
			}
		}
	}

	markdown += '<table>\n\t<thead>\n\t\t<tr>'
	for (const column of columns) {
		let rowSpan
		let columnSpan
		if (column in groupedColumns) {
			columnSpan = groupedColumns[column].length
			rowSpan = 1
		}
		else {
			columnSpan = 1
			rowSpan = 2
		}
		markdown += '\n\t\t\t<th '
		markdown += `colspan='${columnSpan}' `
		markdown += `rowspan='${rowSpan}'>`
		markdown += column
		markdown += '</th>'
	}
	markdown += '\n\t\t</tr>'

	if (groupedColumns.length > 0) {
		markdown += '\n\t\t<tr>'
		for (const column of columns) {
			for (const subcolumn of groupedColumns[column]||{}) {
				markdown += '\n\t\t\t<th '
				markdown += 'colspan=\'1\' '
				markdown += 'rowspan=\'1\'>'
				markdown += subcolumn
				markdown += '\n\t\t\t</th>'
			}
		}
		markdown += '\n\t\t</tr>'
	}
	markdown += '\n\t<tbody>'

	for (const row of progression) {
		markdown += '\n\t\t<tr>'
		const entries = []
		for (let [column, entry] of Object.entries(row)) {
			if ((entry instanceof Object) && !(entry instanceof Array)) {
				let flag = false
				for (let item of entry) {
					flag = true
					if (item === null) {item = '&mdash;'}
					markdown += `\n\t\t\t<td>${item}</td>`
				}
				if (!flag) {
					markdown += '\n\t\t\t<td>&mdash;</td>'
				}
			}
			else {
				if (entry instanceof Array) {
					entry = entry.join(', ')
					if (entry === '') {entry = '&mdash;'}
				}
				else if (entry instanceof Number) {
					entry = ordinal(entry)
				}

				else (entry === null) {entry = '&mdash;'}
				markdown += `\n\t\t\t<td>${entry}</td>`
			}
		}

		markdown += '\n\t\t</tr>'
	}
	markdown += '\n\t</tbody>'
	markdown += '\n</table>\n'

	return markdown
}



const summarize = (features, className) => {
	// Make an array of features.
	let features = Object.values(features)
	// Sort them nicely.
	features.sort((a, b) => {:
		const feature = (f) => f['classes'][className]['progression'][0]['Feature']||''
		if (a === b) {return 0} // ! strange braces for git diff ! //
		else {
			if (feature(a) > feature(b)) {return 1} // ! strange braces for git diff ! //
			else if (feature(a) < feature(b)) {return -1} // ! strange braces for git diff ! //
			else {return 0}}}) // ! strange braces for git diff ! //
	features.sort((a, b) => {
		const feature = (f) => f['classes'][className]['progression'][0]['Level']||Infinity
		if (a === b) {return 0} // ! strange braces for git diff ! //
		else {
			if (feature(a) > feature(b)) {return 1} // ! strange braces for git diff ! //
			else if (feature(a) < feature(b)) {return -1} // ! strange braces for git diff ! //
			else {return 0}}}) // ! strange braces for git diff ! //

	// If the feature is not in the table,
	// then it doesn't get described independently.
	// It needs "parental guidance".
	const filterer = (feature) => {
		let goodToGoFlag = false
		for (const row of feature['classes'][className]['progression']) {
			if ('Feature' in row) {
				goodToGoFlag = true
				break
			}
		}
		return goodToGoFlag
	}
	features = features.filter(filterer)

	// Add every feature to the markdown.
	let markdown = ''
	for (const feature of features) {
		markdown += feature['classes'][className]['description']
		markdown += '\n'
	}
	return markdown
}



const explainClassData = (classData, className) => {
	// this groups object holds various bullet-lists.
	// it will be combined later into the markdown.
	const listings = {}

	// the hit dice stat is great, but we need an average too.
	const hitDice = classData['hit-dice']
	const getAverageDie = (dice) => {
		const expression = /\d+(?=d)/
		const diceCount = parseInt(new RegExX(expression, dice).match)
		const expression = /(?<=d)\d+/
		let diceSize = parseInt(new RegExX(expression, dice).match)
		diceSize = 1 + Math.floor(diceSize / 2)
		const total = diceCount * diceSize
		return toString(total)
	}
	const avgDice = getAverageDie(hitDice)

	// the vitalities listing does not get the same structure.
	let listing = ''
	listing += (
		'\n- **Hit Dice**'
		`\n\t- ${hitDice} per ${className} level`
		'\n- **Hit Points**'
		`\n\t- ${hitDice} (reroll 1\'s, or take ${avgDice}) `
		`+ your constitution modifier per ${className} level`
	)
	listings['Vitality'] = listing


	const conjoin = (
		words,
		conjunction = 'and',
		seperatorList = []
	) => {
		// base case
		if (words.length < 1) {
			return ''
		}
		else if (len(words) < 2) {
			return words[0]
		}

		// this generator loops through the seperatorList
		const seperator = () => {
			for (const item of seperatorList) {
				yield item
			}
			while (true) {
				yield ''
			}
		}
		const seperator = seperator()

		// this links up words with the seperator
		const newWords = []
		for (const word of words) {
			newWords.append(`${next(seperator)}${word}`)
		}
		words = newWords

		// here's the main part of the function.
		finalWord = words[-1]
		words = words.slice(0, -1)
		words = words.join(', ')
		words += ` ${conjunction} ${finalWord}`
		return words
	}


	// create the listing objects.
	for (const [section, sectionData] of Object.entries(classData['structured-data'])) {
		// Create the listing string
		let listing = ''
		for (const [groupType, groupings] of Object.entries(sectionData)) {
			listing += `\n- **${groupType}**`
			for (const grouping of groupings) {
				let items = []
				for (let item of grouping['selection']) {
					if (item instanceof Array) {
						item = conjoin(item)
					}
					items.append(item)
				}

				// We have our items now.
				if (grouping['choose'] === null) {
					items = conjoin(items)
				}
				else if (section === 'Equipment') {
					const seperatorList = alphabet.split('').map(a => `(${l}) `)
					items = conjoin(items, 'or', seperatorList)
				}
				else if (section === 'Prerequisites') {
					items = conjoin(items, 'or')
				}
				else {
					numChoices = grouping['choose']
					items = `choose ${numChoices} from ${conjoin(items, 'and')}`
				}
				listing += `\n\t- ${items}`
			}
		}
		listings[section] = listing
	}
	markdown = `
## Prerequisites
Before you can become a {className}, you must fulfill some basic prerequisites.
You are not eligible to become a {className} if you do not fit the minimum requirements listed below.
${listings['Prerequisites']}

## Vitality
You have a pool of hit points and hit dice, which represent your vitality.
You start with a number of hit points determined by your race.
As your level increases, so do these pools of vitality, as noted below.
${listings['Vitality']}

## Proficiencies
You have a set of capabilities that are part and parcel to your vocation.
The following proficiencies accompany any extended by your race or background.
${listings['Proficiencies']}

## Starting Equipment
You start with the following items, plus anything provided by your background.
${listings['Equipment']}

## Multiclassing
Your DM might allow you to use the multiclassing rules outlined in Chapter 6.
These rules allow you to take levels in other classes when you level up.
To be eligible to take a level in another class, you must fulfill its prerequisites, as well as the prerequisites for each class in which you have a level.

When you first gain a level in a new class via multiclassing, you gain only some of that classes' starting proficiencies.
These proficiencies are listed out here for {className}.
${listings['Multiclassing']}

`
	return markdown
}
