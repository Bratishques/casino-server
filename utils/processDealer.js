const countDealer = require("./countDealer")

const processDealer = (arr) => {
    let value = 0
    value = countDealer([arr[0]])
    return `x + ${value}`

}

module.exports = processDealer