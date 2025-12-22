const burger = document.querySelector('.burger');
const mobileNav = document.querySelector('.mobile-nav');
// Always load page at top
if ("scrollRestoration" in history) {
  history.scrollRestoration = "manual";
}
window.addEventListener("load", () => {
  window.scrollTo(0, 0);
});

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
  // Measure once images are loaded
  if (window.matchMedia("(min-width: 1141px)").matches) {

    const bigLogo = document.querySelector(".logo-section img");
    const navLogo = document.querySelector(".navbar_logo svg");
    const navBlock = document.querySelector(".nav-block");

    window.addEventListener("load", () => {

      const navBlockRect = navBlock.getBoundingClientRect();
      const scrollEnd =
        navBlockRect.top + window.scrollY - 20;

      gsap.set(bigLogo, {clearProps: "transform"});

      const bigRect = bigLogo.getBoundingClientRect();
      const navRect = navLogo.getBoundingClientRect();

      const scale = navRect.width / bigRect.width;

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


  const lines = gsap.utils.toArray(".hero-text .line");
  const xValues = [ -150, 0, 120 ];
  gsap.to(lines, {
    x: (i) => xValues[i] ?? 0,
    duration: 0.6,
    ease: "power2.out",
    stagger: 0.05,
    scrollTrigger: {
      trigger: ".hero-text",
      start: "center center",
      once: true
    }
  });
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
  fitVideo();
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

  var scale_h = bgWidth / vid_w_orig;
  var scale_v = bgHeight / vid_h_orig;
  var scale = Math.max(scale_h, scale_v);

  if (scale * vid_w_orig < min_w) {
    scale = min_w / vid_w_orig;
  }

  var videoWidth = scale * vid_w_orig;
  var videoHeight = scale * vid_h_orig;

  // Apply video size
  video.style.width = videoWidth + 'px';
  video.style.height = videoHeight + 'px';

  viewport.scrollLeft = (videoWidth - bgWidth) / 2;
  viewport.scrollTop = (videoHeight - bgHeight) / 2;
}

// END
