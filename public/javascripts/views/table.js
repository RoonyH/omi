var TableView = Backbone.View.extend({

  el: function(){
    return $('#table-' + this.model.id);
  },

  template: $('#template-table').html(),

  initialize: function() {
    this.listenTo(this.model.get('cards'), 'add', this.placedCard);
  },

  render: function(){
  },

  placedCard: function(card){
    var cardView = new CardView({model: card});
    this.$el.append(cardView.render().html());
  }
});
