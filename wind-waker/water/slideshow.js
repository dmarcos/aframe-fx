  AFRAME.registerComponent('slideshow', {
  schema: {
    slides: {type: 'array'}
  },
  init: function () {
    var slideEl;
    var slideTextEl;

    this.slideEls = [];
    this.addStyles();

    for (var i = 0; i < this.data.slides.length; ++i) {
      slideEl = document.querySelector(this.data.slides[i]);
      this.slideEls.push(slideEl);
      slideEl.object3D.visible = false;
      slideTextEl = slideEl.querySelector('.slide')
      if (slideTextEl) { slideTextEl.classList.add('hidden'); }
    }

    this.onKeyDown = this.onKeyDown.bind(this);
    this.showSlide = this.showSlide.bind(this);

    this.showSlide();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('hashchange', this.showSlide);
  },

  addStyles: function () {
    var css =
      '.slide {font-family: Helvetica; border-right: 1px solid rgb(70, 70, 70); color: rgb(70, 70, 70);' +
      'z-index: 9999; position: absolute; width: 30%;' +
      'display: inline-block; top: 10%; bottom: 10%; padding: 20px;' +
      'font-size: 15pt; }' +
      '.slide.hidden { display: none; }' +
      '.slide div {position: relative; top: 50%;' +
      'transform: translateY(-50%); text-align: center}' +
      '.slide h1 {font-size: 20pt; display: inline; color: #2d2d2d}';
    var style = document.createElement('style');

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
  },


  onKeyDown: function () {
    var currentSlideIndex = this.currentSlideIndex;
    var keyCode = event.keyCode;

    // Left or right keys.
    if (keyCode !== 37 && keyCode !== 39) { return; }
    if (keyCode === 37) {
      if (currentSlideIndex === 0) {
        currentSlideIndex = this.data.slides.length - 1;
      } else {
        currentSlideIndex--;
      }
    }

    if (keyCode === 39) {
      if (currentSlideIndex === (this.data.slides.length - 1)) {
        currentSlideIndex = 0;
      } else {
        currentSlideIndex++;
      }
    }

    window.location.hash = currentSlideIndex;
  },

  showSlide: function () {
    var slideTextEl;
    var currentUrl = document.URL;
    var slideIndex = currentUrl.split('#')[1];
    var cameraSlideEl;

    slideIndex = this.currentSlideIndex = Number.parseInt(slideIndex) || 0;
    cameraSlideEl = this.slideEls[slideIndex].querySelector("[camera]");

    if (cameraSlideEl) { cameraSlideEl.setAttribute('camera', 'active', true); }
    this.slideEls[slideIndex].play();
    this.slideEls[slideIndex].object3D.visible = true;
    slideTextEl = this.slideEls[slideIndex].querySelector('.slide')
    if (slideTextEl) { slideTextEl.classList.remove('hidden'); }
    for (var i = 0; i < this.data.slides.length; i++) {
      if (i === slideIndex) { continue; }
      cameraSlideEl = this.slideEls[i].querySelector("[camera]");
      if (cameraSlideEl) { cameraSlideEl.setAttribute('camera', 'active', false); }
      this.slideEls[i].pause();
      this.slideEls[i].object3D.visible = false;
      slideTextEl = this.slideEls[i].querySelector('.slide')
      if (slideTextEl) { slideTextEl.classList.add('hidden'); }
    }
  }
});