var CardView = Backbone.View.extend({
  template: $('#template-card').html(),

  render: function(){
    var card = {url: this.getUrl()};
    this.$el.addClass('card');
    this.$el.html(Mustache.render(this.template, card));
    return this.$el;
  },

  getUrl: function(){
    var value = this.model.get('value');
    var kind = this.model.get('kind');

    console.log(value + kind);

    if(!value||!kind){
      return "images/classic/u.png"
    }

    if(value < 10){
      value = '0' + value;
    }
    return "images/classic/" + this.model.get('kind') + value + '.png';
  }
});
