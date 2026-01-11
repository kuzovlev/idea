const burger = document.querySelector('.burger');
const mobileNav = document.querySelector('.mobile-nav');
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
  const mm = gsap.matchMedia();
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

  mm.add("(min-width: 768px)", () => {
    const lines = gsap.utils.toArray(".hero-text .line");
    if (!lines.length) return;
    const xValues = [-150, 0, 120];
    const create = () => {
      gsap.fromTo(lines,
        { x: 0 },
        {
          x: (i) => xValues[i] ?? 0,
          duration: 0.6,
          ease: "power2.out",
          stagger: 0.05,
          scrollTrigger: {
            trigger: ".hero-text",
            start: "top 80%",
            toggleActions: "play none none none",
          }
        }
      );
      ScrollTrigger.refresh();
    };
    if (document.readyState === "complete") create();
    else window.addEventListener("load", create, { once: true });
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
  if (window.matchMedia('(max-width: 1024px)').matches) {
    const video = document.querySelector('video');
    const viewport = document.querySelector('#video-viewport');

    // reset anything set by desktop logic
    viewport.style.width = '';
    viewport.style.height = '';
    viewport.scrollLeft = 0;
    viewport.scrollTop = 0;

    video.style.width = '100%';
    video.style.height = 'auto';
    return;
  }
  var video = document.querySelector('video');
  var bg = document.querySelector('.fullsize-video-bg');
  var viewport = document.querySelector('#video-viewport');

  var bgWidth = bg.offsetWidth;
  var bgHeight = bg.offsetHeight;

  viewport.style.width = bgWidth + 'px';
  viewport.style.height = bgHeight + 'px';

  var scale_h = bgWidth / vid_w_orig;
  var scale_v = bgHeight / vid_h_orig;
  var scale = Math.max(scale_h, scale_v);

  if (typeof min_w !== 'undefined' && scale * vid_w_orig < min_w) {
    scale = min_w / vid_w_orig;
  }

  var videoWidth = scale * vid_w_orig;
  var videoHeight = scale * vid_h_orig;

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

gsap.registerPlugin(ScrollTrigger);

window.addEventListener("load", () => {
  const section = document.querySelector(".hero-pin");
  const text    = section.querySelector(".enlarging-text");
  const logos   = gsap.utils.toArray(".hero-pin .logo");
  const vh = () => window.innerHeight;

  const clampPx = (min, fluid, max) => Math.min(max, Math.max(min, fluid));
  const fluidPx = (minPx, maxPx, minVw = 320, maxVw = 1920) => {
    const vw = window.innerWidth;
    const t = (vw - minVw) / (maxVw - minVw);
    return clampPx(minPx, minPx + (maxPx - minPx) * t, maxPx);
  };

  const getMinFontPx = () => {
    const w = window.innerWidth;
    if (w <= 767)  return 32;
    if (w <= 1023) return 50;
    return 70;
  };

  const getTextSizes = () => {
    const minPx = getMinFontPx();
    return {
      from: `${minPx}px`,
      to: `${fluidPx(minPx, 264, 320, 1440)}px`,
    };
  };

  const mm = gsap.matchMedia();

  mm.add(
    {
      mobile: "(max-width: 767px)",
      desktop: "(min-width: 768px)",
    },
    (context) => {
      const { mobile } = context.conditions;

      ScrollTrigger.getAll().forEach(st => st.kill());
      gsap.killTweensOf([section, text, logos]);

      gsap.set(section, { clearProps: "transform" });
      gsap.set(text, { clearProps: "fontSize,transform" });
      gsap.set(logos, { clearProps: "transform,opacity,willChange" });

      if (mobile) {
        gsap.set(logos, { y: 0, opacity: 1, willChange: "auto" });
        return;
      }

      const baseStart = vh() * 1.2;

      const startOffsets = [
        +0.15,
        -0.25,
        +0.10,
        -0.20,
      ];

      const speeds = [
        1.1,
        1.0,
        1.6,
        2.2,
      ];

      logos.forEach((el, i) => {
        const offset = startOffsets[i] ?? 0;
        const speed  = speeds[i] ?? 1;

        el.dataset.speed = speed;

        gsap.set(el, {
          y: baseStart + vh() * offset,
          opacity: 0,
          willChange: "transform,opacity",
        });
      });

      const fontSizes = getTextSizes();

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + vh() * 2,
          scrub: true,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      // Text scale
      tl.fromTo(
        text,
        { fontSize: fontSizes.from },
        { fontSize: fontSizes.to, ease: "none", duration: 1 }
      );

      // Logos fade in
      tl.to(
        logos,
        { opacity: 1, duration: 0.15, stagger: 0.03, ease: "none" },
        ">"
      );

      const baseTravel = vh() * 3.5;
      logos.forEach((el) => {
        const startY = gsap.getProperty(el, "y");
        const speed  = Number(el.dataset.speed);

        tl.to(
          el,
          {
            y: startY - baseTravel * speed,
            ease: "none",
            duration: 2,
          },
          "<"
        );
      });

      ScrollTrigger.refresh();
    }
  );
});

document.addEventListener("DOMContentLoaded", () => {
  const rows = Array.from(document.querySelectorAll(".clients-row"));
  if (!rows.length) return;
  const setActive = (row) => {
    rows.forEach(r => r.classList.toggle("is-active", r === row));
  };
  setActive(rows[0]);
  const isFinePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches;
  rows.forEach(row => {
    if (isFinePointer) {
      row.addEventListener("pointerenter", () => setActive(row));
    }
    row.addEventListener("pointerup", (e) => {
      e.preventDefault?.();
      setActive(row);
    });
  });
});

const wrapper = document.querySelector('.footer-logo_wrapper');
let expanded = false;

function atPageEnd() {
  return window.scrollY + window.innerHeight >=
    document.documentElement.scrollHeight - 2;
}

function onScroll() {
  if (expanded) return;

  if (atPageEnd()) {
    wrapper.classList.add('is-expanded');
    expanded = true;
    window.removeEventListener('scroll', onScroll);
  }
}

window.addEventListener('scroll', onScroll, { passive: true });
onScroll();


window.addEventListener("load", () => {
  const section = document.querySelector(".fullsize-image.parallax");
  const img = document.querySelector(".fullsize-image.parallax .parallax-img");
  if (!section || !img) return;

  ScrollTrigger.getById("photoSlow")?.kill();
  gsap.killTweensOf(img);

  gsap.fromTo(
    img,
    { y: "-26%" },
    {
      y: "36%",
      ease: "none",
      scrollTrigger: {
        id: "photoSlow",
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        invalidateOnRefresh: true,
      }
    }
  );

  ScrollTrigger.refresh();

  const swiper = new Swiper('.reviews-swiper', {
    slidesPerView: 'auto',
    spaceBetween: 10,
    centeredSlides: true,
    initialSlide: 1,
    observer: true,
    observeParents: true,
    // loop: true,
    navigation: {
      nextEl: '.swiper-next',
      prevEl: '.swiper-prev',
    },
    breakpoints: {
      786: {
        spaceBetween: 90
      },
      1024:{
        spaceBetween: 185
      }
    }
  })
  swiper.update();
  swiper.slideTo(1, 0);
});

(() => {
  const logo = document.querySelector(".logo-section");
  const main = document.getElementById("main-content");
  if (!logo || !main) return;

  let locked = false;
  let logoTop = 0;
  let mainTop = 0;

  const EPS = 2;

  const SNAP_DURATION = 1000; // ms
  const EASING = (t) => (t < 0.5
    ? 4 * t * t * t
    : 1 - Math.pow(-2 * t + 2, 3) / 2); // easeOutCubic

  function refreshAnchors() {
    logoTop = Math.round(logo.getBoundingClientRect().top + window.scrollY);
    mainTop = Math.round(main.getBoundingClientRect().top + window.scrollY);
  }

  function snapTo(targetY) {
    locked = true;

    const startY = window.scrollY;
    const delta = targetY - startY;
    const startTime = performance.now();

    function frame(now) {
      const t = Math.min((now - startTime) / SNAP_DURATION, 1);
      const eased = EASING(t);
      window.scrollTo(0, startY + delta * eased);

      if (t < 1) {
        requestAnimationFrame(frame);
      } else {
        locked = false;
      }
    }

    requestAnimationFrame(frame);
  }

  refreshAnchors();
  window.addEventListener("resize", refreshAnchors);

  const ro = new ResizeObserver(refreshAnchors);
  ro.observe(document.body);

  window.addEventListener(
    "wheel",
    (e) => {
      if (locked) {
        e.preventDefault();
        return;
      }

      const down = e.deltaY > 0;
      const y = window.scrollY;

      if (down && y < mainTop - EPS) {
        e.preventDefault();
        snapTo(mainTop);
        return;
      }

      if (!down && Math.abs(y - mainTop) <= EPS) {
        e.preventDefault();
        snapTo(logoTop);
        return;
      }
    },
    { passive: false }
  );

  let startY = null;
  window.addEventListener("touchstart", (e) => {
    startY = e.touches[0]?.clientY ?? null;
  }, { passive: true });

  window.addEventListener(
    "touchmove",
    (e) => {
      if (startY == null) return;

      if (locked) {
        e.preventDefault();
        return;
      }

      const currY = e.touches[0]?.clientY ?? startY;
      const down = startY - currY > 0;
      const y = window.scrollY;

      if (down && y < mainTop - EPS) {
        e.preventDefault();
        snapTo(mainTop);
        return;
      }

      if (!down && Math.abs(y - mainTop) <= EPS) {
        e.preventDefault();
        snapTo(logoTop);
        return;
      }
    },
    { passive: false }
  );
})();
function splitToLines(el) {
  // Save original HTML once (so we can re-split on resize)
  if (!el.dataset.original) el.dataset.original = el.innerHTML;

  // Restore
  el.innerHTML = el.dataset.original;

  // Wrap words to measure line breaks
  const words = el.textContent.trim().split(/\s+/);
  el.textContent = "";

  const wordSpans = words.map((word, i) => {
    const span = document.createElement("span");
    span.textContent = word + (i < words.length - 1 ? " " : "");
    span.style.display = "inline";
    el.appendChild(span);
    return span;
  });

  // Group words by their offsetTop (line)
  const lines = [];
  let currentLineTop = null;
  let currentLine = [];

  wordSpans.forEach((span) => {
    const top = span.offsetTop;

    if (currentLineTop === null) {
      currentLineTop = top;
    }

    if (top !== currentLineTop) {
      lines.push(currentLine);
      currentLine = [];
      currentLineTop = top;
    }

    currentLine.push(span);
  });

  if (currentLine.length) lines.push(currentLine);

  // Build line wrappers
  el.textContent = "";

  lines.forEach((lineWords, idx) => {
    const line = document.createElement("span");
    line.className = "reveal-line";

    const inner = document.createElement("span");
    inner.className = "reveal-line-inner";
    inner.style.setProperty("--line-index", idx);

    lineWords.forEach((w) => inner.appendChild(w));
    line.appendChild(inner);
    el.appendChild(line);
  });
}

function setupReveal() {
  const items = document.querySelectorAll("[data-reveal]");

  items.forEach((el) => {
    splitToLines(el);
  });

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-inview");
        // reveal only once:
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.2 });

  items.forEach((el) => io.observe(el));

  // Re-split on resize (line breaks change!)
  let rAF = null;
  window.addEventListener("resize", () => {
    cancelAnimationFrame(rAF);
    rAF = requestAnimationFrame(() => {
      items.forEach((el) => {
        // keep it revealed if it already was
        const wasRevealed = el.classList.contains("is-inview");
        splitToLines(el);
        if (wasRevealed) el.classList.add("is-inview");
      });
    });
  });
}

document.addEventListener("DOMContentLoaded", setupReveal);
