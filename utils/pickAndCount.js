const eval = require('./eval')



const pickAndCount = async (player, deck) => {
    let addition = deck.pop()
    player.pickedCard = [...player.pickedCard, addition]
    
    player.ownScore += eval(player.pickedCard)
    let pickedCards = player.pickedCard
    for (let card of player.pickedCard) {
      if (/a[htcp]/ig.test(card)) {
        player.acePick = true
        player.pickedCard = pickedCards
        console.log(player.pickedCard)
      }
      else {
        player.cards = [...player.cards, card]
        pickedCards = pickedCards.filter(a => a != card)
        player.turn++
        player.pickedCard = pickedCards
        return addition
      }
      
    }
   

}

module.exports = pickAndCount