const {model, Schema}= require('mongoose');

var schema = new Schema({
    messages: [{sender: String, message: String}],
    socketPlayers: [],
    players: [{name: String, cards: Array, isSpectating: Boolean, acePick: Boolean, isEnough: Boolean, overDrafted: Boolean, turn: Number, ownScore: Number, pickedCard: Array, socketId: String}],
    stage: Number,
    dealerScore: Number,
    dealerCards: [],
    deck: [],
    
}, {versionKey: false});

module.exports = model("Game", schema)