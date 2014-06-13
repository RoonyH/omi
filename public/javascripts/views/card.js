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
    if(value < 10){
      value = '0' + value;
    }
    return "images/classic/" + this.model.get('kind') + value + '.png';
  }
});
