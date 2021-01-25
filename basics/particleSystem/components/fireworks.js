AFRAME.registerComponent('fireworks', {
  schema: {
    delay: {default: 1200}
  },

  init: function () {
    this.fireworkColors = [
      '#ff2727',
      '#ff91c3',
      '#ffbc6d',
      '#ff2ce9',
      '#fef716',
      '#45ff1a',
      'white',
      '#fff04a'
    ];
    this.timeSinceLastFirework = 0;
    this.el.setAttribute('particle-system-shell', {
      particleSize: 0.015,
      src: '#particleFirework',
      particleSpeed: 0.020,
      particleLifeTime: 500
    });

    this.el.setAttribute('particle-system-explosion', {
      particleSize: 0.015,
      src: '#particleFirework',
      particleSpeed: 0.025,
      on: 'particleended',
      particleLifeTime: 4000
    });
    this.frames = 0;
    this.deltaFrames = 0;
  },

  tick: function (time, delta) {
    var x;
    var shellDuration;
    var colorIndex = Math.floor(Math.random() * this.fireworkColors.length);
    var color = this.fireworkColors[colorIndex];
    this.deltaFrames += delta;

    this.timeSinceLastFirework += delta;
    if (this.timeSinceLastFirework <= this.data.delay) { return; }
    this.timeSinceLastFirework = 0;
    x = Math.random() * 0.5;
    sign = Math.floor(Math.random() * 2) === 0 ? 1 : -1;
    shellDuration = 500 + Math.floor(Math.random() * 300);
    this.el.setAttribute('particle-system-shell', 'particleLifeTime', shellDuration);
    this.el.components['particle-system-shell'].startShell(x * sign, 0);
    this.el.setAttribute('particle-system-shell', 'color', color);
    this.el.setAttribute('particle-system-explosion', 'color', color);
  }
});