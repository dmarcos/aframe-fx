AFRAME.registerComponent('drawcalls',{
  schema: {target: {type: 'selector'}},
  tick: function () {
    var renderer = this.el.sceneEl.renderer;
    this.data.target.innerHTML = renderer.info.render.calls;
  }
});