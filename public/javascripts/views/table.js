define(['jquery', 'backbone', 'views/card'], function($, Backbone, cardView){
  var TableView = Backbone.View.extend({

    el: function(){
      return $('#table-' + this.model.id);
    },

    template: $('#template-table').html(),

    initialize: function() {
      this.listenTo(this.model, 'card-placed', this.placedCard);
      this.listenTo(this.model.get('cards'), 'reset', this.render);
    },

    render: function(){
      var table = {
        name: this.model.get('name')
      };
      this.$el.addClass('game-table');
      this.$el.html(Mustache.render(this.template, table));
      return this.$el;
    },

    placedCard: function(data){
      console.log(data.pid)
      var cv = new cardView.CardView({model: data.card, el: '#t-card-'+data.pid});
      this.$('#cards').append(cv.render());
    },
    
    clear: function(){  
      this.$('#cards').html('');
    }
  });

  return {
    TableView: TableView
  }
});
