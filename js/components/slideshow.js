  AFRAME.registerComponent('slideshow', {
  schema: {
    slides: {type: 'array'},
    firstSlideIndex: {default: 0},
    loadAlwaysFirstSlide: {default: true},
    enabled: {default: true},
    vrEnabled: {default: true}
  },

  init: function () {
    var slideEl;
    var slideTextEl;
    var data = this.data;

    this.slideEls = [];
    this.addStyles();

    for (var i = 0; i < data.slides.length; ++i) {
      slideEl = document.querySelector(data.slides[i]);
      this.slideEls.push(slideEl);
      slideEl.object3D.visible = false;
      slideTextEl = slideEl.querySelector('.slide');
      if (slideTextEl) { slideTextEl.classList.add('hidden'); }
    }

    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.showSlide = this.showSlide.bind(this);


    if (data.slides.length === 1) {
      this.setHash(data.firstSlideIndex);
      this.showSlide();
      return;
    }

    this.createControlButtons();

    if (data.loadAlwaysFirstSlide) { this.setHash(data.firstSlideIndex); }
    this.showSlide();

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
    window.addEventListener('hashchange', this.showSlide);
  },

  setBackground: function (slideEl) {
    var sceneEl = this.el.sceneEl;
    var counterTextEl = this.counterTextEl;
    var backgroundColor = slideEl.getAttribute('background-color');
    var slide = slideEl.querySelector('.slide');

    if (slideEl.querySelector('.dark')) {
      sceneEl.setAttribute('background', 'color', 'black');
      counterTextEl.style.color = 'white';
    } else {
      sceneEl.setAttribute('background', 'color', 'white');
      counterTextEl.style.color = '';
    }

    if (backgroundColor) {
      slide.style.backgroundColor = backgroundColor;
      slide.style.color = 'white';
      slide.style.borderRight = '1px solid white';
      slide.style.textShadow = '1px 1px black';
      sceneEl.setAttribute('background', 'color', backgroundColor);
    } else {
      slide.style.color = '';
      slide.style.borderRight = '';
      slide.style.textShadow = '';
      slide.style.backgroundColor = '';
    }
  },

  update: function () {
    /*if (this.data.enabled) {
      this.startSlideShow();
    } else {
      this.stopSlideShow();
    }*/
  },

  startSlideShow: function () {
    this.controlsContainerEl.classList.remove('hidden');
  },

  stopSlideShow: function () {
    this.controlsContainerEl.classList.add('hidden');
  },

  createControlButtons: function (onClick) {
    var nextButtonEl;
    var previousButtonEl;
    var controlsContainerEl;
    var counterEl;
    var self = this;

    // Create elements.
    controlsContainerEl = this.controlsContainerEl = document.createElement('div');
    controlsContainerEl.classList.add('a-slideshow-container');

    this.previousButtonEl = previousButtonEl = document.createElement('button');
    previousButtonEl.classList.add('a-slideshow-button');
    previousButtonEl.classList.add('a-slideshow-button-previous');
    previousButtonEl.classList.add('previous');
    if (!this.data.enabled) { previousButtonEl.classList.add('hidden'); }
    previousButtonEl.setAttribute('title', 'Previous Slide');

    counterEl = this.counterEl = document.createElement('div');
    counterEl.classList.add('a-slideshow-counter');
    this.counterTextEl = document.createElement('span');
    this.counterEl.appendChild(this.counterTextEl);

    this.nextButtonEl = nextButtonEl = document.createElement('button');
    nextButtonEl.classList.add('a-slideshow-button');
    nextButtonEl.classList.add('a-slideshow-button-next');
    nextButtonEl.classList.add('next');
    if (!this.data.enabled) { nextButtonEl.classList.add('hidden'); }
    nextButtonEl.setAttribute('title', 'Next Slide');

    this.portraitMessageEl = portraitMessageEl = document.createElement('div');
    portraitMessageEl.classList.add('a-slideshow-portrait-message');
    portraitMessageEl.innerHTML = 'Turn your device for slideshow';
    if (!this.data.enabled) { portraitMessageEl.classList.add('hidden'); }

    // Insert elements.
    controlsContainerEl.appendChild(previousButtonEl);
    controlsContainerEl.appendChild(counterEl);
    controlsContainerEl.appendChild(nextButtonEl);
    controlsContainerEl.appendChild(portraitMessageEl);

    nextButtonEl.addEventListener('click', function (evt) {
      self.loadNextSlide();
      evt.stopPropagation();
    });

    previousButtonEl.addEventListener('click', function (evt) {
      self.loadNextSlide();
      evt.stopPropagation();
    });
    this.el.sceneEl.appendChild(controlsContainerEl);
  },

  addStyles: function () {
    var infoMessageNextButtonDataURI = 'url(data:image/svg+xml;base64,PHN2ZyBpZD0iTGF5ZXJfNCIgZGF0YS1uYW1lPSJMYXllciA0IiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNTAgNjIiPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDojZmZmO308L3N0eWxlPjwvZGVmcz48cGF0aCBjbGFzcz0iY2xzLTEiIGQ9Ik0xMzgsMEgxMkExMiwxMiwwLDAsMCwwLDEyVjUwQTEyLDEyLDAsMCwwLDEyLDYySDEzOGExMiwxMiwwLDAsMCwxMi0xMlYxMkExMiwxMiwwLDAsMCwxMzgsMFpNNDkuMTksNDZINDJMMzEuNDUsMjcuNDJWNDZIMjQuMjZWMTYuMTRoNy4xOUw0MiwzNC43MlYxNi4xNGg3LjE3Wk03NC4zNiwyMS43SDYwLjk0VjI4SDcyLjI2djUuMzRINjAuOTR2Ny4xM0g3NC4zMlY0Nkg1My43NVYxNi4xNEg3NC4zNlptMTksMjQuMy01LTEwLjExTDgzLjM2LDQ2SDc1LjA3bDguNTYtMTVMNzUuMywxNi4xNGg4LjJsNC44OCw5LjkzLDQuODgtOS45M2g4LjIzTDkzLjE0LDMxLDEwMS43MSw0NlptMzQuMDgtMjQuM2gtOVY0NmgtNy4yVjIxLjdoLTguOFYxNi4xNGgyNVoiLz48L3N2Zz4=)';
    var infoMessagePrevButtonDataURI = 'url(data:image/svg+xml;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0idXRmLTgiPz4NCjwhLS0gR2VuZXJhdG9yOiBBZG9iZSBJbGx1c3RyYXRvciAyNS4wLjEsIFNWRyBFeHBvcnQgUGx1Zy1JbiAuIFNWRyBWZXJzaW9uOiA2LjAwIEJ1aWxkIDApICAtLT4NCjxzdmcgdmVyc2lvbj0iMS4xIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHhtbG5zOnhsaW5rPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rIiB4PSIwcHgiIHk9IjBweCINCgkgdmlld0JveD0iMCAwIDE1MCA2MiIgc3R5bGU9ImVuYWJsZS1iYWNrZ3JvdW5kOm5ldyAwIDAgMTUwIDYyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSI+DQo8c3R5bGUgdHlwZT0idGV4dC9jc3MiPg0KCS5zdDB7ZGlzcGxheTpub25lO30NCgkuc3Qxe2Rpc3BsYXk6aW5saW5lO30NCgkuc3Qye2ZpbGw6bm9uZTt9DQoJLnN0M3tmaWxsOiNGRkZGRkY7fQ0KPC9zdHlsZT4NCjxnIGlkPSJCYWNrZ3JvdW5kIiBjbGFzcz0ic3QwIj4NCgk8cmVjdCBjbGFzcz0ic3QxIiB3aWR0aD0iMTUwIiBoZWlnaHQ9IjYyIi8+DQo8L2c+DQo8ZyBpZD0iQlVUVE9OIiBjbGFzcz0ic3QwIj4NCgk8ZyBjbGFzcz0ic3QxIj4NCgkJPGc+DQoJCQk8cG9seWdvbiBjbGFzcz0ic3QyIiBwb2ludHM9IjU5LjgsMzQuNyA0OS4yLDE2IDQyLDE2IDQyLDQ2IDQ5LjIsNDYgNDkuMiwyNy40IDU5LjksNDYgNjcuMSw0NiA2Ny4xLDE2IDU5LjgsMTYgCQkJIi8+DQoJCQk8cG9seWdvbiBjbGFzcz0ic3QyIiBwb2ludHM9IjczLDQ2IDgwLjIsNDYgODAuMiwzNC4xIDkxLjksMzQuMSA5MS45LDI4LjUgODAuMiwyOC41IDgwLjIsMjEuNiA5My4xLDIxLjYgOTMuMSwxNiA3MywxNiAJCQkiLz4NCgkJCTxyZWN0IHg9IjI5IiB5PSIxNiIgY2xhc3M9InN0MiIgd2lkdGg9IjcuMiIgaGVpZ2h0PSIzMCIvPg0KCQkJPHBhdGggY2xhc3M9InN0MiIgZD0iTTExNywxNy40Yy0yLTEuMi00LjMtMS44LTYuOC0xLjhjLTIuNiwwLTQuOSwwLjYtNi45LDEuOGMtMiwxLjItMy42LDMtNC43LDUuMmMtMS4xLDIuMy0xLjYsNC45LTEuNiw3LjgNCgkJCQl2MS43YzAuMSwyLjgsMC42LDUuNCwxLjgsNy42YzEuMSwyLjIsMi43LDMuOSw0LjcsNS4xczQuMywxLjgsNi44LDEuOHM0LjktMC42LDYuOS0xLjhjMi0xLjIsMy42LTMsNC43LTUuMg0KCQkJCWMxLjEtMi4zLDEuNi00LjksMS42LTcuOHYtMS40YzAtMi45LTAuNi01LjUtMS43LTcuN0MxMjAuNiwyMC4zLDExOSwxOC42LDExNywxNy40eiIvPg0KCQkJPGc+DQoJCQkJPHJlY3QgeD0iMjkiIHk9IjE2IiBjbGFzcz0ic3QyIiB3aWR0aD0iNy4yIiBoZWlnaHQ9IjMwIi8+DQoJCQkJPHBvbHlnb24gY2xhc3M9InN0MiIgcG9pbnRzPSI3Myw0NiA4MC4yLDQ2IDgwLjIsMzQuMSA5MS45LDM0LjEgOTEuOSwyOC41IDgwLjIsMjguNSA4MC4yLDIxLjYgOTMuMSwyMS42IDkzLjEsMTYgNzMsMTYgCQkJCSIvPg0KCQkJCTxwb2x5Z29uIGNsYXNzPSJzdDIiIHBvaW50cz0iNTkuOCwzNC43IDQ5LjIsMTYgNDIsMTYgNDIsNDYgNDkuMiw0NiA0OS4yLDI3LjQgNTkuOSw0NiA2Ny4xLDQ2IDY3LjEsMTYgNTkuOCwxNiAJCQkJIi8+DQoJCQkJPHBhdGggY2xhc3M9InN0MiIgZD0iTTExNywxNy40Yy0yLTEuMi00LjMtMS44LTYuOC0xLjhjLTIuNiwwLTQuOSwwLjYtNi45LDEuOGMtMiwxLjItMy42LDMtNC43LDUuMmMtMS4xLDIuMy0xLjYsNC45LTEuNiw3LjgNCgkJCQkJdjEuN2MwLjEsMi44LDAuNiw1LjQsMS44LDcuNmMxLjEsMi4yLDIuNywzLjksNC43LDUuMXM0LjMsMS44LDYuOCwxLjhzNC45LTAuNiw2LjktMS44YzItMS4yLDMuNi0zLDQuNy01LjINCgkJCQkJYzEuMS0yLjMsMS42LTQuOSwxLjYtNy44di0xLjRjMC0yLjktMC42LTUuNS0xLjctNy43QzEyMC42LDIwLjMsMTE5LDE4LjYsMTE3LDE3LjR6Ii8+DQoJCQkJPHBhdGggY2xhc3M9InN0MyIgZD0iTTEzOCwwSDEyQzUuNCwwLDAsNS40LDAsMTJ2MzhjMCw2LjYsNS40LDEyLDEyLDEyaDEyNmM2LjYsMCwxMi01LjQsMTItMTJWMTJDMTUwLDUuNCwxNDQuNiwwLDEzOCwweg0KCQkJCQkgTTM2LjIsNDZIMjlWMTZoNy4yVjQ2eiBNNjcuMSw0NmgtNy4yTDQ5LjIsMjcuNFY0Nkg0MlYxNmg3LjJsMTAuNiwxOC43VjE2aDcuMlY0NnogTTkzLjEsMjEuNkg4MC4ydjYuOWgxMS43djUuNkg4MC4ydjEySDczDQoJCQkJCVYxNmgyMC4xVjIxLjZ6IE0xMjMuNCwzMS43YzAsMi45LTAuNSw1LjUtMS42LDcuOGMtMS4xLDIuMy0yLjYsNC00LjcsNS4yYy0yLDEuMi00LjMsMS44LTYuOSwxLjhzLTQuOC0wLjYtNi44LTEuOA0KCQkJCQlzLTMuNS0yLjktNC43LTUuMWMtMS4xLTIuMi0xLjctNC43LTEuOC03LjZ2LTEuN2MwLTMsMC41LTUuNiwxLjYtNy44YzEuMS0yLjMsMi42LTQsNC43LTUuMmMyLTEuMiw0LjMtMS44LDYuOS0xLjgNCgkJCQkJYzIuNiwwLDQuOCwwLjYsNi44LDEuOGMyLDEuMiwzLjYsMi45LDQuNyw1LjJjMS4xLDIuMiwxLjcsNC44LDEuNyw3LjdWMzEuN3oiLz4NCgkJCTwvZz4NCgkJPC9nPg0KCQk8cGF0aCBjbGFzcz0ic3QzIiBkPSJNMTEwLjIsMjEuMmMtMy42LDAtNS42LDIuNy01LjgsOC4ybDAsMi4yYzAsMywwLjUsNS4yLDEuNSw2LjhzMi40LDIuNCw0LjQsMi40YzEuOCwwLDMuMy0wLjgsNC4yLTIuMw0KCQkJYzEtMS42LDEuNS0zLjgsMS41LTYuN3YtMS40YzAtMy0wLjUtNS4zLTEuNS02LjhDMTEzLjUsMjIsMTEyLjEsMjEuMiwxMTAuMiwyMS4yeiIvPg0KCTwvZz4NCjwvZz4NCjxnIGlkPSJMYXllcl80IiBjbGFzcz0ic3QwIj4NCgk8ZyBjbGFzcz0ic3QxIj4NCgkJPGc+DQoJCQk8cGF0aCBjbGFzcz0ic3QzIiBkPSJNMTM4LDBIMTJDNS40LDAsMCw1LjQsMCwxMnYzOGMwLDYuNiw1LjQsMTIsMTIsMTJoMTI2YzYuNiwwLDEyLTUuNCwxMi0xMlYxMkMxNTAsNS40LDE0NC42LDAsMTM4LDB6DQoJCQkJIE00OS4yLDQ2SDQyTDMxLjUsMjcuNFY0NmgtNy4yVjE2LjFoNy4yTDQyLDM0LjdWMTYuMWg3LjJWNDZ6IE03NC40LDIxLjdINjAuOVYyOGgxMS4zdjUuM0g2MC45djcuMWgxMy40VjQ2SDUzLjdWMTYuMWgyMC42DQoJCQkJVjIxLjd6IE05My40LDQ2bC01LTEwLjFsLTUsMTAuMWgtOC4zbDguNi0xNS4xbC04LjMtMTQuOGg4LjJsNC45LDkuOWw0LjktOS45aDguMmwtOC4zLDE0LjhsOC42LDE1LjFIOTMuNHogTTEyNy41LDIxLjdoLTlWNDYNCgkJCQloLTcuMlYyMS43aC04Ljh2LTUuNmgyNVYyMS43eiIvPg0KCQk8L2c+DQoJPC9nPg0KPC9nPg0KPGcgaWQ9IkxheWVyXzRfY29weSI+DQoJPGc+DQoJCTxnPg0KCQkJPHBhdGggY2xhc3M9InN0MyIgZD0iTTM1LjMsMjEuN2gtNC44djguNmg0LjdjMS40LDAsMi41LTAuMywzLjItMXMxLjEtMS43LDEuMS0zYzAtMS40LTAuNC0yLjUtMS4xLTMuM1MzNi42LDIxLjcsMzUuMywyMS43eg0KCQkJCSBNMTM4LDBIMTJDNS40LDAsMCw1LjQsMCwxMnYzOGMwLDYuNiw1LjQsMTIsMTIsMTJoMTI2YzYuNiwwLDEyLTUuNCwxMi0xMlYxMkMxNTAsNS40LDE0NC42LDAsMTM4LDB6IE00My42LDMzLjMNCgkJCQljLTIuMSwxLjctNC45LDIuNi04LjYsMi42aC00LjZWNDZoLTcuMlYxNi4xaDExLjljMi4zLDAsNC4zLDAuNCw2LjEsMS4zczMuMSwyLDQuMSwzLjZjMSwxLjYsMS40LDMuMywxLjQsNS4zDQoJCQkJQzQ2LjgsMjkuMiw0NS43LDMxLjUsNDMuNiwzMy4zeiBNNzQuNyw0Nkg2N2wtNS4zLTEwLjZoLTMuOVY0NmgtNy4yVjE2LjFoMTEuOGMzLjUsMCw2LjMsMC44LDguMywyLjRzMywzLjgsMyw2LjcNCgkJCQljMCwyLjEtMC40LDMuOC0xLjMsNS4yYy0wLjgsMS40LTIuMiwyLjUtMy45LDMuM2w2LjIsMTIuMVY0NnogTTk4LjYsMjEuN0g4NS4yVjI4aDExLjN2NS4zSDg1LjJ2Ny4xaDEzLjRWNDZINzhWMTYuMWgyMC42VjIxLjd6DQoJCQkJIE0xMTcsNDZoLTcuOWwtMTAtMjkuOWg4bDUuOSwyMS43bDUuOS0yMS43aDhMMTE3LDQ2eiBNNjIuMywyMS43aC00LjZ2OC4yaDQuNmMxLjQsMCwyLjQtMC40LDMuMS0xLjFjMC43LTAuNywxLTEuNywxLTMNCgkJCQljMC0xLjMtMC4zLTIuMy0xLTNDNjQuNywyMiw2My43LDIxLjcsNjIuMywyMS43eiIvPg0KCQk8L2c+DQoJPC9nPg0KPC9nPg0KPGcgaWQ9IkZvbnQiIGNsYXNzPSJzdDAiPg0KCTx0ZXh0IHRyYW5zZm9ybT0ibWF0cml4KDEgMCAwIDEgMjkgLTI0KSIgY2xhc3M9InN0MSIgc3R5bGU9ImZvbnQtZmFtaWx5OidSb2JvdG8tQmxhY2snOyBmb250LXNpemU6NDIuMzc1cHg7Ij5JTkZPPC90ZXh0Pg0KPC9nPg0KPC9zdmc+DQo=)';
    var css =
      '.slide {font-family: Helvetica; border-right: 1px solid rgb(70, 70, 70); color: #2d2d2d;' +
      'z-index: 9999; position: absolute; width: 30%;' +
      'display: inline-block; top: 10%; bottom: 10%; padding: 20px;' +
      'font-size: 15pt; }' +
      '.slide.hidden { display: none; }' +
      '.slide div {position: relative; top: 50%;' +
      'transform: translateY(-50%); text-align: center; padding: 20px}' +
      '.slide h1 {font-size: 20pt; marging: 50%; text-align: right;}' +
      '.slide p {font-size: 12pt; text-align: justify;}' +
      '.slide.dark {background-color: black; color: white}' +

      '.a-slideshow-container {display:flex; position: absolute; left: calc(50% - 105px); bottom: 20px; width: 210px;}' +
      //'.a-slideshow-container .hidden {display: none}' +
      '.a-slideshow-button-previous {background: rgba(0, 0, 0, 0.35) ' + infoMessagePrevButtonDataURI + ' 50% 50% no-repeat;}' +
      '.a-slideshow-button-next {background: rgba(0, 0, 0, 0.35) ' + infoMessageNextButtonDataURI + ' 50% 50% no-repeat;}' +
      '.a-slideshow-button {background-size: 92% 90%; border: 0; bottom: 0; cursor: pointer; min-width: 78px; min-height: 34px; padding-right: 0; padding-top: 0; transition: background-color .05s ease; -webkit-transition: background-color .05s ease; z-index: 9999; border-radius: 8px; touch-action: manipulation;}' +
      '.a-slideshow-button.next {right: -60px;}' +
      '.a-slideshow-button.previous {right: 60px;}' +
      '.a-slideshow-button .hidden {display: none}' +
      '.a-slideshow-button:active, .a-slideshow-button:hover, .hover {background-color: #ef2d5e;}' +
      '.a-slideshow-counter {align: auto; height: 34px; text-align: center; min-width: 50px; color: #2d2d2d; display: inline-block;}' +
      '.a-slideshow-counter span {line-height: 34px; display: inline-block; vertical-align: middle;}' +
      '.a-slideshow-portrait-message {display: none}' +

      '@media only screen and (max-height: 600px) {' +
        '.slide h1 {font-size: 12pt;}' +
        '.slide p {font-size: 8pt;}' +
      '}' +

      '@media (orientation: portrait) { ' +
        '.a-slideshow-portrait-message {display: inline-block; text-align: center; width: 250px; border: 3px solid rgb(51, 51, 51); line-height: 27px; height: 27px; margin-bottom: 2px; border-radius: 10px; background-color: white; }' +
        '.a-slideshow-container {right: 20px; left: auto; width: 250px}' +
        '.a-slideshow-button {display: none}' +
        '.a-slideshow-counter {display: none}' +
        '.slide {display: none}' +
      '}';
    var style = document.createElement('style');

    if (style.styleSheet) {
      style.styleSheet.cssText = css;
    } else {
      style.appendChild(document.createTextNode(css));
    }

    document.getElementsByTagName('head')[0].appendChild(style);
  },


  onKeyDown: function (evt) {
    var keyCode = evt.keyCode;

    // Left or right keys.
    if (keyCode !== 37 && keyCode !== 39) { return; }
    if (keyCode === 37) {
      this.previousButtonEl.classList.add('hover');
      this.loadPreviousSlide();
    }
    if (keyCode === 39) {
      this.nextButtonEl.classList.add('hover');
      this.loadNextSlide();
    }
  },

  onKeyUp: function (evt) {
    var keyCode = evt.keyCode;

    // Left or right keys.
    if (keyCode !== 37 && keyCode !== 39) { return; }
    if (keyCode === 37) { this.previousButtonEl.classList.remove('hover'); }
    if (keyCode === 39) { this.nextButtonEl.classList.remove('hover'); }
  },

  loadNextSlide: function () {
    var currentSlideIndex = this.currentSlideIndex;
    if (currentSlideIndex === (this.data.slides.length - 1)) {
      currentSlideIndex = 0;
    } else {
      currentSlideIndex++;
    }
    this.setHash(currentSlideIndex);
  },

  loadPreviousSlide: function () {
    var currentSlideIndex = this.currentSlideIndex;
    if (currentSlideIndex === 0) {
      currentSlideIndex = this.data.slides.length - 1;
    } else {
      currentSlideIndex--;
    }
    this.setHash(currentSlideIndex);
  },

  setHash: function (slideIndex) {
    window.location.hash = slideIndex;
  },

  showSlide: function () {
    var slideTextEl;
    var currentUrl = document.URL;
    var slideIndex = currentUrl.split('#')[1];
    var cameraSlideEl;
    var counterTextEl = this.counterTextEl;
    var currentSlideEl;

    slideIndex = this.currentSlideIndex = Number.parseInt(slideIndex) || 0;
    cameraSlideEl = this.slideEls[slideIndex].querySelector("[camera]");
    if (cameraSlideEl) { cameraSlideEl.setAttribute('camera', 'active', true); }
    currentSlideEl = this.slideEls[slideIndex];
    currentSlideEl.play();
    currentSlideEl.object3D.visible = true;
    this.setBackground(currentSlideEl);

    slideTextEl = currentSlideEl.querySelector('.slide');
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

    if (counterTextEl) { counterTextEl.innerHTML = slideIndex + 1 + '/' + this.data.slides.length; }
    this.el.setAttribute('vr-mode-ui', 'enabled', this.data.vrEnabled && this.currentSlideIndex === this.data.firstSlideIndex);
  }
});