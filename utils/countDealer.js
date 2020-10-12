const countDealer = (arr, currentScore = 0) => {

    let count = 0
    for (let elem of arr) {
        const preValue = elem.replace(/[htcp]/ig,"")
        if (preValue === "j" || preValue === "q" || preValue === "k") {
            let value = 10
            count += value
        }
        else if (preValue != "a") {
            let value = Number(preValue)
            count += value
        }
        else if (currentScore < 11) {
            let value = 11
            count += value
        }
        else {
            count += 1
        }
    
    }
    return count


}

module.exports = countDealer