define(['jquery', 'backbone', 'views/card'], function($, Backbone, cardView){
  var TableView = Backbone.View.extend({

    el: function(){
      return $('#table-' + this.model.id);
    },

    template: $('#template-table').html(),

    initialize: function() {
      this.listenTo(this.model.get('cards'), 'add', this.placedCard);
    },

    render: function(){
      var table = {
        name: this.model.get('name')
      };
      this.$el.addClass('game-table');
      this.$el.html(Mustache.render(this.template, table));
      return this.$el;
    },

    placedCard: function(card){
      var cv = new cardView.CardView({model: card});
      this.$el.append(cv.render().html());
    }
  });

  return {
    TableView: TableView
  }
});
