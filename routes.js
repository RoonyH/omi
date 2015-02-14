var url = require('url');

var gameModule = require('./game');

exports.index = function(req, res){
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  if(req.cookies.sec){
    console.log('------>Index: Sec:" + req.cookies.sec + "<------');
    gameModule.getGameBySec(req.cookies.sec, function(err, game){
      console.log(game)
      if(err=='no-such-game'){
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

    if(query.gameId==='new'){

      gameModule.registerGame(function(gameId){
        gameModule.registerPlayer(gameId, function(err, playerId, sec){
          res.cookie('sec', sec)
          res.render('game', {gameId: gameId, playerId: playerId});
        });
      });

    } else {


      if(query.gameId==='join'){

        gameModule.getOpenGame(function(gameId){
          gameModule.registerPlayer(gameId, function(err, playerId, sec){
            res.cookie('sec', sec)
            res.render('game', {gameId: gameId, playerId: playerId});
          });
        });

      } else {

        var gameId = parseInt(query.gameId);
      
        gameModule.registerPlayer(gameId, function(err, playerId, sec){
          res.cookie('sec', sec)
          res.render('game', {gameId: gameId, playerId: playerId});
        });
      }
    }
  }
};


exports.game = function(opt, callback){
  console.log('game: Finding game ' + JSON.stringify(opt))

  var gameId = opt.gameId;
  var playerId = opt.playerId;

  var player = {
    playerId: opt.playerId,
    socketId: opt.socketId,
    name: opt.name
  };

  gameModule.getStatus(gameId, function(status){

    if(!status){
      console.log('game: Game not active!');
      return;
    }

    gameModule.getHand(gameId, playerId, function(hand){

      if(status!=gameModule.gameStatus.WAITING_CARD_PLAY)
        hand = hand.slice(0, 4);

      gameModule.getTable(gameId, function(table){
        gameModule.getPlayers(gameId, function(err, players){
          gameModule.getTurn(gameId, function(turn){
            gameModule.getScore(gameId, function(score){
              gameModule.getTrumpher(gameId, function(trumpher){
              gameModule.getTrumphs(gameId, function(trumphs){
                gameModule.addPlayer(gameId, playerId, player, function(){

                  var details = {
                    hand: hand,
                    table: table,
                    players: players,
                    trumpher: trumpher,
                    trumphs: trumphs,
                    status: status,
                    turn: turn,
                    score: score
                  };

                  if(status==gameModule.gameStatus.WAITING_PLAYER_JOIN && playerId==4){
                    gameModule.setStatus(gameId, gameModule.gameStatus.WAITING_TRUMPS_PICK, function(){
                      details.status = gameModule.gameStatus.WAITING_TRUMPS_PICK

                      callback(details);
                    });
                  } else {
                    callback(details);
                  }
                });
              });
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
      console.log('round: Previous round still on');
      callback('previous-round-on');
      return;
    } else {
      gameModule.newRound(gameId, playerId, function(err, round){
        callback(null, round);
      });
    }
  });
}


exports.trumpsPicked = function(data, callback){
  gameModule.getTrumpher(data.gameId, function(t){
    if(t != data.playerId){
      console.log('trumphsPicked: not the right user!');
      callback('not-trumpher', null);
    }

    trumphKind = {
      Clubs: "c",
      Hearts: "h",
      Spades: "s",
      Diamonds: "d"
    }

    gameModule.getStatus(data.gameId, function(status){

      if(status!=gameModule.gameStatus.WAITING_TRUMPS_PICK){
        console.log('trumphsPicked: not the right time!');
        callback('wrong-status');
        return;
      }

      gameModule.setTrumphs(data.gameId, trumphKind[data.trumphs], function(){
        gameModule.setStatus(data.gameId, gameModule.gameStatus.WAITING_CARD_PLAY, function(){
          gameModule.getGame(data.gameId, function(game){
            callback(null, game);
          });
        });
      });
    });
  });
}


exports.cardPlayed = function(data, callback){
  var gameId = data.gameId;
  var playerId = data.playerId;
  var card = data.card;

  console.log("CardPlayed: gameId: "+gameId+" playerId: "+playerId+
              " card: "+JSON.stringify(card));

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
      callback("not_started");
      return;
    }

  gameModule.getTurn(gameId, function(turn){

    if(playerId!=turn){
      callback('not_turn');
      return;
    }

  gameModule.getHand(gameId, playerId, function(hand){
    console.log(JSON.stringify(hand))
  
    var index = findCard(card, hand);

    console.log('CardPlayed: Card Index in hand: '+index);

    if(index===-1){
      callback('dont-have-card');
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
          
          console.log("CardPlayed: found kind index" + kindIndex)
          
          if(kindIndex!=-1){
            callback("cant_play_kind_" + kind)
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
      card.pid = playerId;
      gameModule.addToTable(gameId, card, function(game){
        gameModule.setTurn(gameId, (turn%4)+1, function(){
          gameModule.getGame(gameId, function(game){
            checkWinner(gameId, function(winner){
              if(winner){
                gameModule.resetTable(gameId, winner.playerId, function(){
                  gameModule.getScore(gameId, function(score){
                    game.score = score;
                    if(!hand.length){
                      gameModule.clearRound(gameId, function(status){
                        gameModule.registerRound(gameId, function(){
                          callback(null, game, winner, status);
                        });
                      });
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
