const eval = (arr) => {
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
    
    }

    return count

}

module.exports = eval