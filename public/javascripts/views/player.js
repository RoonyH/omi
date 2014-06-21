var PlayerView = Backbone.View.extend({

  el: function(){
    return $('#player-' + this.model.id);
  },

  template: $('#template-player').html(),

  initialize: function() {
    this.listenTo(this.model.get('cards'), 'add', this.givenCard);
    this.listenTo(this.model.get('cards'), 'remove', this.takenCard);
  },

  render: function(){
  },

  givenCard: function(card){
    var cardView = new CardView({model: card});
    this.$('#cards').append(cardView.render());
  },

  takenCard: function(card){
    card.remove();
    this.$('#card-' + card.cid).remove();
  }
});
