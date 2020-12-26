AFRAME.registerComponent('uv-values', {
  init: function () {
    this.topLeftUVEl = document.querySelector('#topLeftUV');
    this.topRightUVEl = document.querySelector('#topRightUV');
    this.bottomLeftUVSpriteEl = document.querySelector('#bottomLeftUV');
    this.bottomRightUVSpriteEl = document.querySelector('#bottomRightUV');
  },

  tick: function (time) {
    var startTime = this.startTime = this.startTime || time;
    var elapsedTime = time - this.startTime;
    var spriteIndex = Math.floor((elapsedTime / 500) % 3);
    if (spriteIndex === 0) {
      this.topLeftUVEl.setAttribute('text', 'value', '0, 1');
      this.topRightUVEl.setAttribute('text', 'value', '0.33, 1');
      this.bottomLeftUVSpriteEl.setAttribute('text', 'value', '0, 0');
      this.bottomRightUVSpriteEl.setAttribute('text', 'value', '0.33, 0');
    }
    if (spriteIndex === 1) {
      this.topLeftUVEl.setAttribute('text', 'value', '0.33, 1');
      this.topRightUVEl.setAttribute('text', 'value', '0.66, 1');
      this.bottomLeftUVSpriteEl.setAttribute('text', 'value', '0.33, 0');
      this.bottomRightUVSpriteEl.setAttribute('text', 'value', '0.66, 0');
    }
    if (spriteIndex === 2) {
      this.topLeftUVEl.setAttribute('text', 'value', '0.66, 1');
      this.topRightUVEl.setAttribute('text', 'value', '1, 1');
      this.bottomLeftUVSpriteEl.setAttribute('text', 'value', '0.66, 0');
      this.bottomRightUVSpriteEl.setAttribute('text', 'value', '1, 0');
    }
  }
});