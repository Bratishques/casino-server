const express = require("express");
const app = express();
var server = require("http").createServer(app);
const connectDB = require("./connectdb");
const Game = require("./Models/game");
const defaultPlayer = require("./defaultPlayer");
const deck = require("./deck");
const shuff = require("./shuff");
const checkOD = require("./checkOD");
const countDealer = require("./countDealer");
const processDealer = require("./processDealer");
const allSpec = require("./allSpec");
const pickAndCount = require("./pickAndCount");

const sleep = (milliseconds) => {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
};

const PORT = 5000 || process.env.PORT;
app.use(express.json({ extended: true }));
app.get("/", (req, res) => {
  res.send("<h1>Hello world</h1>");
});
connectDB();

const io = require("socket.io")(server);
io.on("connection", (socket) => {
  console.log("a user connected");
  socket.on("createRoom", async () => {
    const msg = { sender: "System", message: "Bomb has been planted" };
    const room = new Game();
    const id = room._id;
    room.messages.push(msg);
    room.deck = [...deck];
    room.stage = 0;
    await room.save();

    socket.emit("newMessage", {
      text: `Created a room ${id}`,
      id: `${id}`,
    });
  });
  socket.on("enterRoom", async (data, cb) => {
    const msg = { sender: "System", message: "User has joined!" };
    const roomArr = await Game.find({ _id: data.id });
    const room = roomArr[0];

    if (!room) {
      console.log("There is no such room");
      return;
    }
    room.socketPlayers = [...room.socketPlayers, socket.id];

    console.log(socket.id);
    room.messages = [...room.messages, msg];
    await room.save();
    const msgs = room.messages;

    socket.to(data.id).emit("receiveMessage", { msg: msg });

    cb({ msgs: msgs });
    console.log("sent Name request");
    socket.join(data.id);

    socket.on("disconnecting", async () => {
      console.log(`User left ${data.id}`);
      console.log(socket.id);
      try {
        const roomArr = await Game.find({ _id: data.id });
        const room = roomArr[0];
        room.socketPlayers = room.socketPlayers.filter((a) => {
          if (a === socket.id) {
            return;
          }
          return a;
        });
        room.players = room.players.filter((a) => {
          if (a.socketId === socket.id) {
            return;
          }
          return a;
        });

        if (room.socketPlayers.length === 0) {
          await Game.deleteOne({ _id: data.id });
          return;
        }

        await room.save();
        socket.to(data.id).emit("changePlayers", { players: room.players });
      } catch (e) {
        console.log(e);
        console.log("We have a error");
      }
    });

    socket.on("nameChosen", async (payload, cb) => {
      try {
        const roomArr = await Game.find({ _id: data.id });
        const room = roomArr[0];
        for (let player of room.players) {
          if (player.name === payload.name) {
            cb({ error: "Name is taken" });
            return;
          }
        }
        room.players = [
          ...room.players,
          defaultPlayer(payload.name, socket.id),
        ];

        await room.save();
        console.log(room.stage);

        cb({ players: room.players, stage: room.stage });

        socket.to(data.id).emit("changePlayers", { players: room.players });
      } catch (e) {
        console.log(e);
        console.log("We have a error");
      }
    });

    socket.on("Ready", async (payload, cb) => {
      try {
        const roomArr = await Game.find({ _id: data.id });
        const room = roomArr[0];
        console.log(payload.text);
        room.players.forEach((a) => {
          if (a.name === payload.name) {
            a.isSpectating = false;
          }
        });
        await room.save();

        const commence = async () => {
          console.log("game started");
          const roomArr = await Game.find({ _id: data.id });
          const room = roomArr[0];
          for (let player of room.players) {
            if (player.isSpectating === true) {
              for (let player of room.players) {
                let {
                  name,
                  ownScore,
                  overDrafted,
                  turn,
                  isEnough,
                  isSpectating,
                  acePick,
                } = player;
                io.in(data.id).emit("changePlayerCard", {
                  name: name,
                  ownScore: ownScore,
                  overDrafted: overDrafted,
                  turn: turn,
                  isEnough: isEnough,
                  isSpectating: isSpectating,
                  acePick: acePick,
                });
              }
              return;
            }
          }
          for (let player of room.players) {
            player.cards = [];
            await room.save();
            io.in(data.id).emit("changePlayers", { players: room.players });
          }
          room.deck = [...deck];

          room.deck = shuff(room.deck);
          room.dealerCards = [room.deck.pop()];
          room.dealerScore = countDealer(room.dealerCards);
          await room.save();
          io.in(data.id).emit("changeDealer", {
            cards: ["x"],
            score: processDealer(room.dealerCards),
          });
          await sleep(500);
          room.dealerCards = [...room.dealerCards, room.deck.pop()];
          room.dealerScore = countDealer(room.dealerCards, room.dealerScore);
          await room.save();
          io.in(data.id).emit("changeDealer", {
            cards: ["x", room.dealerCards[1]],
            score: processDealer(room.dealerCards),
          });
          for (let player of room.players) {
            if (!player.isSpectating) {
              let lastCard = await pickAndCount(player, room.deck);

              await room.save();
              let { name, ownScore, overDrafted, turn, isEnough } = player;
              io.in(data.id).emit("changePlayerCard", {
                card: lastCard,
                name: name,
                ownScore: ownScore,
                overDrafted: overDrafted,
                turn: turn,
                isEnough: isEnough,
              });
              await sleep(500);
            }
          }
          for (let player of room.players) {
            if (!player.isSpectating) {
              let lastCard = await pickAndCount(player, room.deck);
              await room.save();
              let {
                name,
                ownScore,
                overDrafted,
                turn,
                isEnough,
                isSpectating,
                acePick,
              } = player;
              io.in(data.id).emit("changePlayerCard", {
                card: lastCard,
                name: name,
                ownScore: ownScore,
                overDrafted: overDrafted,
                turn: turn,
                isEnough: isEnough,
                isSpectating: isSpectating,
                acePick: acePick,
              });
              await sleep(500);
            }
          }
          room.stage = 1;
          await room.save();
          io.in(data.id).emit("changeStage", { stage: room.stage });

          console.log(room.stage);

          cb({ stage: room.stage });
        };

        await commence();
      } catch (e) {}
    });

    socket.on("ace", async (payload, cb) => {
      try {
        const roomArr = await Game.find({ _id: data.id });
        const room = roomArr[0];
        for (let player of room.players) {
          if (player.name === payload.name) {
            player.ownScore += Number(payload.value);
            if (player.ownScore > 21) {
              player.overDrafted = true;
            }
            player.turn++;
            let lastCard = player.pickedCard.pop();
            player.cards = [...player.cards, lastCard];
            if (player.pickedCard.length > 0) {
              let stageSwitch = checkOD(room.players);
              if (stageSwitch) {
                room.stage++;
              }
              await room.save();
              let {
                name,
                ownScore,
                overDrafted,
                turn,
                isEnough,
                isSpectating,
                acePick,
              } = player;

              io.in(data.id).emit("changePlayerCard", {
                card: lastCard,
                name: name,
                ownScore: ownScore,
                overDrafted: overDrafted,
                turn: turn,
                isEnough: isEnough,
                isSpectating: isSpectating,
                acePick: acePick,
              });

              cb({ stage: room.stage });
              io.in(data.id).emit("changeStage", { stage: room.stage });
              return;
            }
            player.acePick = false;
            await room.save();
            let {
              name,
              ownScore,
              overDrafted,
              turn,
              isEnough,
              isSpectating,
              acePick,
            } = player;
            io.in(data.id).emit("changePlayerCard", {
              card: lastCard,
              name: name,
              ownScore: ownScore,
              overDrafted: overDrafted,
              turn: turn,
              isEnough: isEnough,
              isSpectating: isSpectating,
              acePick: acePick,
            });
          }

          let stageSwitch = checkOD(room.players);
          if (stageSwitch) {
            room.stage++;
          }
          await room.save();
          cb({ stage: room.stage });
          io.in(data.id).emit("changeStage", { stage: room.stage });
        }
      } catch (e) {
        console.log(e);
      }
    });

    socket.on("pickCard", async (payload, cb) => {
      try {
        console.log(`${payload.name} picked a card`);
        const roomArr = await Game.find({ _id: data.id });
        const room = roomArr[0];
        for (let player of room.players) {
          if (player.name === payload.name) {
            let lastCard = await pickAndCount(player, room.deck);
            if (player.ownScore > 21) {
              player.overDrafted = true;
            }
            let stageSwitch = checkOD(room.players);
            if (stageSwitch) {
              room.stage++;
            }
            await room.save();
            let {
              name,
              ownScore,
              overDrafted,
              turn,
              isEnough,
              isSpectating,
              acePick,
            } = player;
            io.in(data.id).emit("changePlayerCard", {
              card: lastCard,
              name: name,
              ownScore: ownScore,
              overDrafted: overDrafted,
              turn: turn,
              isEnough: isEnough,
              isSpectating: isSpectating,
              acePick: acePick,
            });
          }
        }

        cb({ stage: room.stage });

        socket.to(data.id).emit("changeStage", { stage: room.stage });
      } catch (e) {
        console.log(e);
      }
    });

    socket.on("enough", async (payload, cb) => {
      try {
        console.log(`${payload.name} had enough`);
        const roomArr = await Game.find({ _id: data.id });
        const room = roomArr[0];
        for (let player of room.players) {
          if (player.name === payload.name) {
            player.isEnough = true;
            player.turn = 1337;

            let stageSwitch = checkOD(room.players);
            if (stageSwitch) {
              room.stage++;
            }
            await room.save();
            let {
              name,
              ownScore,
              overDrafted,
              turn,
              isEnough,
              isSpectating,
              acePick,
            } = player;
            io.in(data.id).emit("changePlayerCard", {
              name: name,
              ownScore: ownScore,
              overDrafted: overDrafted,
              turn: turn,
              isEnough: isEnough,
              isSpectating: isSpectating,
              acePick: acePick,
            });
          }
        }

        cb({ stage: room.stage });
        socket.to(data.id).emit("changeStage", { stage: room.stage });
      } catch (e) {
        console.log(e);
      }
    });

    socket.on("countWinners", async () => {
      const roomArr = await Game.find({ _id: data.id });
      const room = roomArr[0];
      console.log(`Dealer ${room.dealerScore}`);
      while (room.dealerScore < 17) {
        console.log("dealerScore");
        io.in(data.id).emit("changeDealer", {
          cards: [...room.dealerCards],
          score: room.dealerScore,
        });
        let card = [room.deck.pop()];
        room.dealerScore += countDealer(card, room.dealerScore);
        room.dealerCards = [...room.dealerCards, ...card];
        console.log("New card emitted");
        await room.save();
        await sleep(1000);
        io.in(data.id).emit("changeDealer", {
          cards: [...room.dealerCards],
          score: room.dealerScore,
        });
      }
      console.log("Counting done");
      room.stage = 0;
      room.players = allSpec(room.players);
      await room.save();
      io.in(data.id).emit("changeStage", { stage: room.stage });
      io.in(data.id).emit("changeDealer", {
        cards: [...room.dealerCards],
        score: room.dealerScore,
      });
       for (let player of room.players) {
      let {
        name,
        ownScore,
        overDrafted,
        turn,
        isEnough,
        isSpectating,
        acePick,
      } = player;
      io.in(data.id).emit("changePlayerCard", {
        name: name,
        ownScore: ownScore,
        overDrafted: overDrafted,
        turn: turn,
        isEnough: isEnough,
        isSpectating: isSpectating,
        acePick: acePick,
      });
    }
    });
   
  });
});

server.listen(process.env.PORT || 5000, () => {
  console.log("listening on *:5000");
});

