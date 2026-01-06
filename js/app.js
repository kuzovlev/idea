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
    const header = document.querySelector("header");

    window.addEventListener("load", () => {

      // -------------------------------------------------
      // 1. Force header into FINAL position for measuring
      // -------------------------------------------------
      gsap.set(header, {y: 20});

      // Measure layout in final visual state
      const navBlockRect = navBlock.getBoundingClientRect();
      const scrollEnd = navBlockRect.top + window.scrollY;

      // Reset logo transforms before measuring
      gsap.set(bigLogo, {clearProps: "transform"});

      const bigRect = bigLogo.getBoundingClientRect();
      const navRect = navLogo.getBoundingClientRect();

      const scale = navRect.width / bigRect.width;
      const deltaX = navRect.left - bigRect.left;
      const deltaY = navRect.top - bigRect.top;

      // -------------------------------------------------
      // 2. Restore INITIAL header position
      // -------------------------------------------------
      gsap.set(header, {y: 90});

      // -------------------------------------------------
      // 3. Huge logo scroll animation
      // -------------------------------------------------
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

      // -------------------------------------------------
      // 4. Logo visibility switch
      // -------------------------------------------------
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

      // -------------------------------------------------
      // 5. Header movement (90px → 20px)
      // -------------------------------------------------
      gsap.to(header, {
        scrollTrigger: {
          start: 0,
          end: scrollEnd,
          scrub: true
        },
        y: 20,
        ease: "none"
      });

    });
  }

  if (window.matchMedia("(min-width: 768px)").matches) {
    const lines = gsap.utils.toArray(".hero-text .line");
    const xValues = [-150, 0, 120];
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

(function () {
  const sections = document.querySelectorAll(".service-subsection[data-img]");
  const imgA = document.getElementById("servicesImgA");
  const imgB = document.getElementById("servicesImgB");

  let activeImg = imgA;
  let inactiveImg = imgB;
  let currentSrc = activeImg.src;
  let isAnimating = false;

  function crossFade(nextSrc) {
    if (!nextSrc || nextSrc === currentSrc || isAnimating) return;

    isAnimating = true;

    inactiveImg.src = nextSrc;

    // Ensure image is loaded before fade
    const startFade = () => {
      inactiveImg.classList.add("is-active");
      activeImg.classList.remove("is-active");

      // Swap references after transition
      setTimeout(() => {
        [activeImg, inactiveImg] = [inactiveImg, activeImg];
        currentSrc = nextSrc;
        isAnimating = false;
      }, 400); // must match CSS transition
    };

    if (inactiveImg.complete) startFade();
    else inactiveImg.onload = startFade;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.5)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

      if (!visible.length) return;

      crossFade(visible[0].target.dataset.img);
    },
    {
      threshold: [0, 0.5, 0.75, 1],
    }
  );

  sections.forEach((section) => observer.observe(section));
})();
