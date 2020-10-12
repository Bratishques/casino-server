const allSpec = (arr) => {
  for (let player of arr) {
      player.isSpectating = true
      player.acePick = false
      player.isEnough = false
      player.turn = 0
      player.overDrafted = 0
      player.ownScore = 0 
  }
  return arr
}

module.exports = allSpec