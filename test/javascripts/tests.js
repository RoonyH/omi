describe('Card Model', function(){
  it('should have defaults', function(){
    var model = new Card();
    expect(model).to.be.ok;
    expect(model.get('name')).to.equal('unknown');
    expect(model.get('kind')).to.equal(null);
    expect(model.get('value')).to.equal(0);
  })
});


describe('Table Model', function(){
  it('should have defaults', function(){
    var model = new Table();
    expect(model).to.be.ok;
    expect(model.get('handNo')).to.equal(0);
    expect(model.get('cards')).to.be.ok;
    expect(model.get('cards').length).to.equal(0);
    expect(model.get('players')).to.be.ok;
    expect(model.get('players').length).to.equal(0);
    expect(model.get('trump')).to.equal(null);
  })
});


describe('Game Model', function(){
  it('should have defaults', function(){
    var model = new Game();
    expect(model).to.be.ok;
    expect(model.get('type')).to.equal('omi');
    expect(model.get('players')).to.be.ok;
    expect(model.get('players').length).to.equal(0);
  })
});


describe('Player Model', function(){
  it('should have defaults', function(){
    var model = new Player();
    expect(model).to.be.ok;
    expect(model.get('id')).to.be.ok;
    expect(model.get('cards')).to.be.ok;
    expect(model.get('cards').length).to.equal(0);
  })
});
