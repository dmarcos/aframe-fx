AFRAME.registerComponent('environment-map', {
  init: function () {
    this.onModelLoaded = this.onModelLoaded.bind(this);
    this.el.addEventListener("model-loaded", this.onModelLoaded);
    this.pmremGenerator = new THREE.PMREMGenerator(this.el.sceneEl.renderer);
    this.pmremGenerator.compileEquirectangularShader();
  },

  onModelLoaded: function () {
    var self = this;
    var path = 'assets/venice-sunset.hdr';
    new THREE.RGBELoader()
        .setDataType(THREE.UnsignedByteType)
        .load(path, function(texture) {
          var envMap = self.pmremGenerator.fromEquirectangular(texture).texture;
          self.pmremGenerator.dispose();
          self.el.sceneEl.object3D.environment = envMap;
        });
  }
});