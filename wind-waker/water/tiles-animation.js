AFRAME.registerComponent('tiles-animation', {
  init: function () {
    this.topTileEl = document.querySelector('.tile.top');
    this.bottomTileEl = document.querySelector('.tile.bottom');
    this.leftTileEl = document.querySelector('.tile.left');
    this.rightTileEl = document.querySelector('.tile.right');
  },

  tick: function (time) {
    var seconds = Math.floor(time / 500) % 5;

    this.topTileEl.object3D.visible = seconds !== 0;
    this.rightTileEl.object3D.visible = seconds !== 0 && seconds !== 1;
    this.bottomTileEl.object3D.visible = seconds !== 0 && seconds !== 1 && seconds !== 2;
    this.leftTileEl.object3D.visible = seconds === 4;
  },
});