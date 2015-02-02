var url = require('url');

var gameModule = require('./game');

exports.index = function(req, res){
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  if(req.cookies.sec){
    console.log("---------> " + req.cookies.sec + "<--------")
    gameModule.getGameBySec(req.cookies.sec, function(err, game){
      console.log(game)
      if(err){
        res.clearCookie('sec')
        handleQuery();
      } else {
        //if there is unfinished game neglect query and load it.
        res.render('game', {gameId: game.gameId, playerId: game.playerId});
      }
    })
  } else {
    handleQuery();
  }

  function handleQuery(){
    if(!query.gameId){
      res.render('index')
      return
    }

    if(query.gameId!='new'){
      var gameId = parseInt(query.gameId);
    
      gameModule.registerPlayer(gameId, function(err, playerId, sec){
        res.cookie('sec', sec)
        res.render('game', {gameId: gameId, playerId: playerId});
      });
    } else {
      gameModule.registerGame(function(gameId){
        gameModule.registerPlayer(gameId, function(err, playerId, sec){
          res.cookie('sec', sec)
          res.render('game', {gameId: gameId, playerId: playerId});
        });
      });
    }
  }
};


exports.game = function(opt, callback){
  console.log('finding game' + JSON.stringify(opt))

  var gameId = opt.gameId;
  var playerId = opt.playerId;

  var player = {
    playerId: opt.playerId,
    socketId: opt.socketId,
    name: opt.name
  }

  gameModule.getStatus(gameId, function(status){
    gameModule.getHand(gameId, playerId, function(hand){

      if(status!=gameModule.gameStatus.WAITING_CARD_PLAY)
        hand = hand.slice(0, 4);

      gameModule.getTable(gameId, function(table){
        gameModule.getPlayers(gameId, function(err, players){
          gameModule.getTurn(gameId, function(turn){
            gameModule.getTrumps(gameId, function(trumphs){
              gameModule.addPlayer(gameId, playerId, player, function(){
                callback({
                  hand: hand,
                  table: table,
                  players: players,
                  trumphs: trumphs,
                  status: status,
                  turn: turn
                });
              });
            });
          });
        });
      });
    });
  });
}


exports.trumpsPicked = function(data, callback){
  gameModule.setStatus(data.gameId, gameModule.gameStatus.WAITING_CARD_PLAY, function(){
    gameModule.getTrumps(data.gameId, function(t){
      if(t.playerId == data.playerId){

        trumphKind = {
          Clubs: "c",
          Hearts: "h",
          Spades: "s",
          Diamonds: "d"
        }

        opt = {
          gameId: data.gameId,
          playerId: data.playerId,
          kind: trumphKind[data.trumphs]
        }

        gameModule.setTrumps(data.gameId, opt, function(){
          gameModule.getGame(data.gameId, function(game){
            callback(null, game);
          });
        });
      } else {
        callback("You are not the player to pick trumps", null);
      }
    });
  });
}


exports.cardPlayed = function(data, callback){
  var gameId = data.gameId;
  var playerId = data.playerId;
  var card = data.card;

  console.log("gameId: "+gameId+"playerId: "+playerId+"card: "+JSON.stringify(card));

  function findCard(card, hand){
    var index = -1;
    for(i=0; i<hand.length; i++){
      if(hand[i].kind===card.kind&&hand[i].value===card.value){
        index = i
        break;
      }
    }
    return index;
  }

  function findCardKind(kind, hand){
    var index = -1;
    for(i=0; i<hand.length; i++){
      if(hand[i].kind===kind){
        index = i
        break;
      }
    }
    return index;
  }

  gameModule.gameBegined(gameId, function(begined){

    if(!begined){
      callback("Not started yet");
      return;
    }

  gameModule.getTurn(gameId, function(turn){

    if(playerId!=turn){
      callback("Not your turn");
      return;
    }

  gameModule.getHand(gameId, playerId, function(hand){
    console.log(JSON.stringify(hand))
  
    var index = findCard(card, hand);

    console.log("Card Index: "+index);

    if(index===-1){
      callback("You don't have that fking card");
      return;
    }

    gameModule.getHandKind(gameId, function(kind){
      if(kind==='n'){ // kind is not set yet. this is the first card in this game-hand
        gameModule.setHandKind(gameId, card.kind, function(){

          hand.splice(index, 1);
          gameModule.setHand(gameId, playerId, hand, function(){
            gameModule.setTurn(gameId, (turn%4)+1, function(){
              card.pid = playerId;
              gameModule.addToTable(data.gameId, card, function(game){
                gameModule.getGame(data.gameId, function(game){
                  checkWinner(data.gameId, function(winner){
                    if(winner){
                      gameModule.resetTable(data.gameId, winner, function(){
                        callback(null, game, winner);
                      })
                      return;
                    }
                    callback(null, game, winner);
                  })
                });
              });
            });
          });

        });
      } else {
        if(kind===card.kind){ //player is playing a card that match game-hand kind. no worries.

          hand.splice(index, 1);
          gameModule.setHand(gameId, playerId, hand, function(){
            gameModule.setTurn(gameId, (turn%4)+1, function(){
              card.pid = playerId;
              gameModule.addToTable(data.gameId, card, function(game){
                gameModule.getGame(data.gameId, function(game){
                  checkWinner(data.gameId, function(winner){
                    if(winner){
                      gameModule.resetTable(data.gameId, winner, function(){
                        callback(null, game, winner);
                      })
                      return;
                    }
                    callback(null, game, winner);
                  })
                });
              });
            });
          });

        } else { //players card does not match the game-hand kind. worry. need to check if they are allowed to play
          //check if player has no cards matching the gamehand kind. TODO

          var kindIndex = findCardKind(kind, hand);
          
          console.log("found kind index" + kindIndex)
          
          if(kindIndex!=-1){
            callback("Can't play that card. play a fking " + kind)
            return
          }

          hand.splice(index, 1);
          gameModule.setHand(gameId, playerId, hand, function(){
            gameModule.setTurn(gameId, (turn%4)+1, function(){
              card.pid = playerId;
              gameModule.addToTable(data.gameId, card, function(game){
                gameModule.getGame(data.gameId, function(game){
                  checkWinner(data.gameId, function(winner){
                    if(winner){
                      gameModule.resetTable(data.gameId, winner, function(){
                        callback(null, game, winner);
                      })
                      return;
                    }
                    callback(null, game, winner);
                  })
                });
              });
            });
          });

        }
      }
    });
  });
  });
  });
  
  function checkWinner(gameId, callback){
    gameModule.getTrumps(gameId, function(trumps){
    gameModule.getHandKind(gameId, function(handkind){
      gameModule.getTable(gameId, function(table){
        var winner = 1;
        var val = 0;
        table.forEach(function(card){
          console.log(val+": "+card.value);
          var cardvalue=card.value;
          if(card.value==1){
            cardvalue = 14;
          }

          if(card.kind===trumps.kind){
            cardvalue+=40;
          }

          if(card.kind!=handkind){
            cardvalue-=20;
          }

          console.log(val+": "+cardvalue);

          if(cardvalue>val){
            val=cardvalue;
            winner=card.pid;
          }
        });
        if(table.length==4){
          console.log('winner is: ' + winner);
          callback(winner);
        } else {
          callback(null);
        }
      })
    });
    });
  }
}
