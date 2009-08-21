var url = require('url');

var gameModule = require('./game');

exports.game = function(opt, callback){
  console.log('finding game' + JSON.stringify(opt))

  var gameId = opt.gameId;

  var game = gameModule.getGame(gameId, function(game){
    callback(game);
  });
}
