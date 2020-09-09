const defaultPlayer = (name, socketId) => {
    return {
        name: name,
        cards: [],
        isSpectating: true,
        acePick: false,
        isEnough: false,
        turn: 0,
        overDrafted: false,
        ownScore: 0, 
        pickedCard: [], 
        socketId: socketId
    }
}

module.exports = defaultPlayer