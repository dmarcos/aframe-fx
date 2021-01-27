AFRAME.registerComponent('swap-entities', {
  schema: {
    toggleButton: {type: 'selector'},
    entity1: {type: 'selector'},
    entity2: {type: 'selector'}
  },
  init: function () {
    var entity1El = this.data.entity1;
    var entity2El = this.data.entity2;
    this.data.toggleButton.addEventListener('click', function (evt) {
      entity1El.object3D.visible = !entity1El.object3D.visible;
      entity2El.object3D.visible = !entity2El.object3D.visible;
      evt.preventDefault();
    });
  }
});