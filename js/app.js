const burger = document.querySelector('.burger');
const mobileNav = document.querySelector('.mobile-nav');

burger.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('is-open');
  document.body.classList.toggle('nav-open', open);
  burger.setAttribute('aria-expanded', open);
});

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    e.preventDefault();

    document.querySelector(this.getAttribute('href')).scrollIntoView({
      behavior: 'smooth'
    });
  });
});

document.addEventListener("DOMContentLoaded", (event) => {
  gsap.registerPlugin(ScrollTrigger);

  if (window.matchMedia("(min-width: 1141px)").matches) {

    // Measure once images are loaded
    if (window.matchMedia("(min-width: 1141px)").matches) {

      const bigLogo = document.querySelector(".logo-section img");
      const navLogo = document.querySelector(".navbar_logo svg");
      const navBlock = document.querySelector(".nav-block");

      window.addEventListener("load", () => {

        // const bigRect = bigLogo.getBoundingClientRect();
        // const navRect = navLogo.getBoundingClientRect();
        const navBlockRect = navBlock.getBoundingClientRect();
        //
        // const deltaX = navRect.left - bigRect.left;
        // const deltaY = navRect.top - bigRect.top;
        // const scale = navRect.height / bigRect.height;
        //
        // 👇 critical part: calculate scroll distance until sticky engages
        const scrollEnd =
          navBlockRect.top + window.scrollY - 20;

        // Clear transforms before measuring
        gsap.set(bigLogo, {clearProps: "transform"});

        const bigRect = bigLogo.getBoundingClientRect();
        const navRect = navLogo.getBoundingClientRect();

// SCALE BY WIDTH — critical fix
        const scale = navRect.width / bigRect.width;

// Position deltas
        const deltaX = navRect.left - bigRect.left;
        const deltaY = navRect.top - bigRect.top;

        gsap.to(bigLogo, {
          scrollTrigger: {
            start: 0,
            end: scrollEnd,
            scrub: true
          },
          x: deltaX,
          y: deltaY,
          scale: scale,
          ease: "none"
        });

        // Visibility swap EXACTLY when sticky starts
        ScrollTrigger.create({
          start: scrollEnd,
          onEnter: () => {
            navLogo.style.opacity = "1";
            bigLogo.style.opacity = "0";
          },
          onLeaveBack: () => {
            navLogo.style.opacity = "0";
            bigLogo.style.opacity = "1";
          }
        });

      });
    }
  }
});


// BG VIDEO PART

var min_w = 300;
var vid_w_orig;
var vid_h_orig;

document.addEventListener('DOMContentLoaded', function () {
  var video = document.querySelector('video');

  vid_w_orig = parseInt(video.getAttribute('width'), 10);
  vid_h_orig = parseInt(video.getAttribute('height'), 10);

  window.addEventListener('resize', fitVideo);
  fitVideo(); // run once on load
});

function fitVideo() {
  var video = document.querySelector('video');
  var bg = document.querySelector('.fullsize-video-bg');
  var viewport = document.querySelector('#video-viewport');

  var bgWidth = bg.offsetWidth;
  var bgHeight = bg.offsetHeight;

  // Match viewport size to background
  viewport.style.width = bgWidth + 'px';
  viewport.style.height = bgHeight + 'px';

  // Calculate scale
  var scale_h = bgWidth / vid_w_orig;
  var scale_v = bgHeight / vid_h_orig;
  var scale = Math.max(scale_h, scale_v);

  // Enforce minimum width
  if (scale * vid_w_orig < min_w) {
    scale = min_w / vid_w_orig;
  }

  var videoWidth = scale * vid_w_orig;
  var videoHeight = scale * vid_h_orig;

  // Apply video size
  video.style.width = videoWidth + 'px';
  video.style.height = videoHeight + 'px';

  // Center video inside viewport
  viewport.scrollLeft = (videoWidth - bgWidth) / 2;
  viewport.scrollTop = (videoHeight - bgHeight) / 2;
}

// END
