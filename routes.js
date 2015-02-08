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

    if(!status){
      console.log("Not!")
      return;
    }

    gameModule.getHand(gameId, playerId, function(hand){

      if(status!=gameModule.gameStatus.WAITING_CARD_PLAY)
        hand = hand.slice(0, 4);

      gameModule.getTable(gameId, function(table){
        gameModule.getPlayers(gameId, function(err, players){
          gameModule.getTurn(gameId, function(turn){
            gameModule.getTrumpher(gameId, function(trumpher){
              console.log("---" + trumpher)
              gameModule.addPlayer(gameId, playerId, player, function(){
                var details = {
                  hand: hand,
                  table: table,
                  players: players,
                  trumpher: trumpher,
                  status: status,
                  turn: turn
                }

                if(status==gameModule.gameStatus.WAITING_PLAYER_JOIN && playerId==4){
                  gameModule.setStatus(gameId, gameModule.gameStatus.WAITING_TRUMPS_PICK, function(){
                    details.status = gameModule.gameStatus.WAITING_TRUMPS_PICK

                    callback(details)
                  })
                } else {
                  callback(details)
                }
              });
            });
          });
        });
      });
    });
  });
}


exports.round = function(opt, callback){
  var gameId = opt.gameId;
  var playerId = opt.playerId;
  gameModule.getStatus(gameId, function(status){
    if(status!=gameModule.gameStatus.WAITING_TRUMPS_PICK){
      console.log("Previous round still on")
      callback("Previous round still on");
      return;
    } else {
      gameModule.newRound(gameId, playerId, function(err, round){
        callback(null, round)
      })
    }
  });
}


exports.trumpsPicked = function(data, callback){
  gameModule.getTrumpher(data.gameId, function(t){
    if(t == data.playerId){

      trumphKind = {
        Clubs: "c",
        Hearts: "h",
        Spades: "s",
        Diamonds: "d"
      }

      gameModule.setTrumphs(data.gameId, trumphKind[data.trumphs], function(){
        gameModule.setStatus(data.gameId, gameModule.gameStatus.WAITING_CARD_PLAY, function(){
          gameModule.getGame(data.gameId, function(game){
            callback(null, game);
          });
        });
      });
    } else {
      callback("You are not the player to pick trumphs", null);
    }
  });
}


exports.cardPlayed = function(data, callback){
  var gameId = data.gameId;
  var playerId = data.playerId;
  var card = data.card;

  console.log("gameId: "+gameId+" playerId: "+playerId+" card: "+JSON.stringify(card));

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

  gameModule.getStatus(gameId, function(status){

    if(status!=gameModule.gameStatus.WAITING_CARD_PLAY){
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
      callback("You don't have that card");
      return;
    }

    gameModule.getHandKind(gameId, function(kind){
      if(kind==='n'){ // kind is not set yet. this is the first card in this game-hand
        gameModule.setHandKind(gameId, card.kind, function(){
          handleCardPlay(gameId, playerId, card, hand, index, turn, callback)


        });
      } else {
        if(kind===card.kind){ //player is playing a card that match game-hand kind. no worries.

          handleCardPlay(gameId, playerId, card, hand, index, turn, callback)

        } else { //players card does not match the game-hand kind. worry. need to check
        // if they are allowed to play
          //check if player has no cards matching the gamehand kind. TODO

          var kindIndex = findCardKind(kind, hand);
          
          console.log("found kind index" + kindIndex)
          
          if(kindIndex!=-1){
            callback("Can't play that card. play a fking " + kind)
            return
          }

          handleCardPlay(gameId, playerId, card, hand, index, turn, callback)
        }
      }
    });
  });
  });
  });
  
  
  function handleCardPlay(gameId, playerId, card, hand, index, turn, callback){
    hand.splice(index, 1);
    gameModule.setHand(gameId, playerId, hand, function(){
      gameModule.setTurn(gameId, (turn%4)+1, function(){
        card.pid = playerId;
        gameModule.addToTable(gameId, card, function(game){
          gameModule.getGame(gameId, function(game){
            checkWinner(gameId, function(winner){
              if(winner){
                gameModule.resetTable(gameId, winner.playerId, function(){
                  gameModule.getScore(gameId, function(score){
                    game.score = score;
                    if(!hand.length){
                      gameModule.registerRound(gameId, function(){
                        callback(null, game, winner);
                      })
                    } else {
                      callback(null, game, winner);
                    }
                  });
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


  function checkWinner(gameId, callback){
    gameModule.getTrumphs(gameId, function(trumphs){
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

          if(card.kind===trumphs){
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
          gameModule.getPlayer(gameId, winner, function(p){
            callback(p);
          });
        } else {
          callback(null);
        }
      })
    });
    });
  }
}
