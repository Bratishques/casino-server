const deck = []

for (let i = 2; i < 11; i++) {
    deck.push(i + "h")
    deck.push(i + "t")
    deck.push(i + "c")
    deck.push(i + "p")
}

    ((arr) => {
        for (let elem of arr) {
            deck.push(elem + "h")
            deck.push(elem + "t")
            deck.push(elem + "c")
            deck.push(elem + "p")
        }

    })(["j","q","k","a"])

module.exports = deck