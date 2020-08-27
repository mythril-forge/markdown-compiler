class RegExX {
	constructor (
		expression,
		string
	) {
		this.regex = new RegExp(expression, 'g')
		this.string = string
		this.array = [...new Array(2)]
		this.exec()
	}

	exec () {
		const array = this.regex.exec(this.string)
		if (array === null) {
			this.array = [...new Array(2)]
		}
		else {
			this.array = array
		}
		return this
	}

	get span () {
		if (this.array.index === undefined) {
			return [undefined, undefined]
		}
		return [this.array.index, this.regex.lastIndex]
	}

	get left () {
		const [start, _] = this.span
		if (start === undefined) {
			return this.string
		}
		else {
			return this.string.slice(0, start)
		}
	}

	get right () {
		const [_, end] = this.span
		if (end === undefined) {
			return ''
		}
		else {
			return this.string.slice(end, Infinity)
		}
	}

	get match () {
		const [start, end] = this.span
		if ((start||end) === undefined) {
			return ''
		}
		else {
			return this.string.slice(start, end)
		}
	}

	get continues () {
		const [start, end] = this.span
		if ((start||end) === undefined) {
			return false
		}
		else {
			return true
		}
	}
}

export {RegExX}
