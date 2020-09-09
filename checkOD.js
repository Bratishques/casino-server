const checkOD = (obj) => {
    let endArray = []
    for (let key of obj) {
    if (!key.isSpectating) {
        if (key.overDrafted || key.isEnough) {
            endArray.push(true)
        }
        else {
            endArray.push(false)
        }
    }
    }
    if (endArray.indexOf(false) > -1) {
        return false
    }
    else return true
}

module.exports = checkOD