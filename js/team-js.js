gsap.registerPlugin(ScrollTrigger);

const section = document.getElementById("pinSection");
const img = document.getElementById("pinImage");
const inner = document.getElementById("innerBlock");

let st; // keep a reference so we can rebuild on resize

function setSectionHeightToImage() {
  // Ensure the section height equals the *rendered* image height
  const h = img.getBoundingClientRect().height;
  section.style.height = `${h}px`;
}

function buildScroll() {
  if (st) st.kill(true);

  // Reset inner to centered before measuring/animating
  gsap.set(inner, { clearProps: "y" });

  // Distance to move: push the inner block fully out above the section
  const sectionH = section.getBoundingClientRect().height;
  const innerRect = inner.getBoundingClientRect();
  const innerH = innerRect.height;

  // Inner starts at center => its top edge is at (sectionH - innerH)/2.
  // To move it fully out above, we need to move it up by:
  // (center-top position) + innerH + a small margin
  const startTop = (sectionH - innerH) / 2;
  const extra = 24; // breathing room so it's clearly out
  const travel = startTop + innerH + extra;

  // Pin the whole section; animate inner block upward while pinned
  st = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: "top top",
      end: () => "+=" + Math.max(travel, innerH), // duration based on content
      scrub: true,
      pin: true,
      pinSpacing: false,
      anticipatePin: 1,
      invalidateOnRefresh: true
    }
  })
    .to(inner, { y: -travel, ease: "none" }, 0);
}

function refreshAll() {
  setSectionHeightToImage();
  buildScroll();
  ScrollTrigger.refresh();
}

// Wait for image load (important for correct height)
if (img.complete) {
  refreshAll();
} else {
  img.addEventListener("load", refreshAll, { once: true });
}

// Keep it correct on resize/orientation change
window.addEventListener("resize", () => {
  setSectionHeightToImage();
  buildScroll();
  ScrollTrigger.refresh();
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

// const marquee = document.querySelector(".marquee");
const track = document.querySelector(".marquee__track");
const first = track.querySelector(".marquee__content");

function setDistance() {
  // width of ONE sequence
  const w = Math.ceil(first.getBoundingClientRect().width);
  track.style.setProperty("--marquee-distance", w);
}

window.addEventListener("load", setDistance);

// update on resize / responsive changes
new ResizeObserver(setDistance).observe(first);


function fadeInOnView({
                        container,
                        itemSelector,
                        stagger = 120,
                        baseDelay = 0,
                        threshold = 0.35,
                        once = true
                      }) {
  const root = document.querySelector(container);
  if (!root) return;

  const items = Array.from(root.querySelectorAll(itemSelector));
  let batch = [];
  let rafId = null;

  function flush() {
    rafId = null;

    batch
      .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
      .forEach((el, i) => {
        el.style.setProperty(
          "--inview-delay",
          `${baseDelay + i * stagger}ms`
        );
        el.classList.add("is-inview");
      });

    batch = [];
  }

  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;

      const el = entry.target;
      if (once) io.unobserve(el);

      batch.push(el);
      if (!rafId) rafId = requestAnimationFrame(flush);
    });
  }, { threshold });

  items.forEach(el => io.observe(el));
}

/* Team items fade in */
fadeInOnView({
  container: ".team-grid",
  itemSelector: ".fade-item",
  stagger: 120
});

/* Values Items fade in */
fadeInOnView({
  container: ".values-wrapper",
  itemSelector: ".fade-item",
  stagger: 80,
  threshold: 0.5
});
