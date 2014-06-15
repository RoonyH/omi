var PlayerView = Backbone.View.extend({

  el: function(){
    return $('#player-' + this.model.id);
  },

  template: $('#template-player').html(),

  initialize: function() {
    this.listenTo(this.model.get('cards'), 'add', this.givenCard);
  },

  render: function(){
  },

  givenCard: function(card){
    var cardView = new CardView({model: card});
    this.$el.append(cardView.render().html());
  }
});
