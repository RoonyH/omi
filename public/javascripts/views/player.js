define(['jquery', 'backbone', 'views/card', 'underscore'], function($, Backbone, cardView, _){

  var PlayerView = Backbone.View.extend({

    el: function(){
      return $('#player-' + this.model.id);
    },

    template: $('#template-player').html(),

    initialize: function() {
      this.listenTo(this.model.get('cards'), 'add', this.givenCard);
      this.listenTo(this.model.get('cards'), 'remove', this.takenCard);
      this.listenTo(this.model, 'sort', this.sortCards);
      this.cards = [];
    },

    render: function(){
      var player = {
        name: this.model.get('name')
      };
      this.$el.addClass('player');
      this.$el.html(Mustache.render(this.template, player));

      this.cardsSection = this.$('#cards')

      return this.$el;
    },

    givenCard: function(card){
      var cv = new cardView.CardView({model: card});
      var obj = {};

      var value = card.get('value');
      if(value == 1){
        value = 14
      }

      obj.sortIndex = card.get('kind')+(value+10);

      obj.view = cv;
      this.cards.push(obj);
      console.log(this.cardsSection)
      this.cardsSection.append(cv.render());
    },

    takenCard: function(card){
      card.remove();
    },

    sortCards: function(){
      this.cards = _.sortBy(this.cards, function(c){return c.sortIndex})
      console.log(this.cards)
      var that = this;
      this.cards.forEach(function(c){
        c.view.$el.fadeOut({complete: function(){
            that.cardsSection.prepend(c.view.$el)
          }
        });
        c.view.$el.fadeIn();
      })
    }
  });

  return {
    PlayerView: PlayerView
  }
});
