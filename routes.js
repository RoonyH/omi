var url = require('url');

var gameModule = require('./game');

exports.game = function(req, res){
  var url_parts = url.parse(req.url, true);
  var query = url_parts.query;

  var gameId = query.id;
  var playerId = query.player;

  if(!gameId){
    var game = new gameModule.Game();
  }

  res.json({table: [], hand: [{kind:'h', value:11}]});
}
