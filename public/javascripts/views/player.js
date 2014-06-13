var PlayerView = Backbone.View.extend({

  el: $('#player-3'),

  template: $('#template-player').html(),

  initialize: function() {
    this.listenTo(this.model, 'card-given', this.givenCard);
  },

  render: function(){
  },

  givenCard: function(card){
    var cardView = new CardView({model: card});
    this.$el.append(cardView.render().html());
  }
});
