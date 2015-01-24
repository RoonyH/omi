var url = require('url');

var gameModule = require('./game');


exports.index = function(req, res){
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  res.cookie('test', 'value')

  if(query.gameId){
    var gameId = parseInt(query.gameId);
  
    gameModule.registerPlayer(gameId, function(playerId, sec){
      res.cookie('sec', sec)
      res.render('game', {gameId: parseInt(query.gameId), playerId: playerId});
    });
  } else {
    gameModule.registerGame(function(gameId){
      gameModule.registerPlayer(gameId, function(playerId, sec){
        res.cookie('sec', sec)
        res.render('game', {gameId: gameId, playerId: playerId})
      });
    });
  }
};


exports.game = function(opt, callback){
  console.log('finding game' + JSON.stringify(opt))

  var gameId = opt.gameId;

  gameModule.getGame(gameId, function(game){
    callback(game);
  });
}


exports.trumpsPicked = function(data, callback){
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
              gameModule.addToTable(data.gameId, card, function(game){
                gameModule.getGame(data.gameId, function(game){
                  checkWinner(data.gameId, function(winner){
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
              gameModule.addToTable(data.gameId, card, function(game){
                gameModule.getGame(data.gameId, function(game){
                  checkWinner(data.gameId, function(winner){
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
  
  function checkWinner(gameId, callback){
    gameModule.getTrumps(gameId, function(trumps){
      gameModule.getTable(gameId, function(table){
        if(table.length==4){
          callback(1);
        } else {
          callback(null);
        }
      })
    });
  }
}
