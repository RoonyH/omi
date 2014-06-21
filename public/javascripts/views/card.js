var CardView = Backbone.View.extend({
  template: $('#template-card').html(),

  initialize: function(){
    this.listenTo(this.model, 'removed', this.removedCard);
  },

  render: function(){
    var card = {url: this.getUrl()};
    this.el.id = 'card-' + this.model.cid;
    this.$el.addClass('card');
    this.$el.html(Mustache.render(this.template, card));
    return this.$el;
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
    return "images/classic/" + this.model.get('kind') + value + '.png';
  },

  removedCard: function(){
    this.remove();
    console.log('removed view');
  }
});
