define(['jquery', 'backbone'], function($, Backbone){
  var CardView = Backbone.View.extend({
    template: $('#template-card').html(),

    initialize: function(){
      this.listenTo(this.model, 'removed', this.removedCard);
      this.listenTo(this.model, 'moved', this.movedCard);
    },

    render: function(){
      var card = {url: this.getUrl()};
      this.$el.addClass('card');
      this.$el.html(Mustache.render(this.template, card));
      return this.$el;
    },

    events: {
      'click': 'clicked'
    },

    getUrl: function(){
      var value = this.model.get('value');
      var kind = this.model.get('kind');

      if(!value||!kind){
        return "images/classic/u.png"
      }

      if(value < 10){
        value = '0' + value;
      }
      return "images/medquality/" + this.model.get('kind') + value + '.png';
    },

    removedCard: function(){
      console.log(this.cid)
      this.remove();
      console.log('removed view');
    },

    movedCard: function(){
      console.log('moved view');
      console.log(this.$el.html());
      this.$el.slideToggle();
      $($("#player-" + omiGameConf.playerId + " #cards")).prepend(this.$el);
      this.$el.slideToggle();
    },
    
    clicked: function(){
      this.model.get('clickHandler')(this.model);
    }
  });

  return {
    CardView: CardView
  };
});
