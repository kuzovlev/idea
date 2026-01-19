(() => {
  // ----------------------------
  // Small helpers
  // ----------------------------
  const qs  = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const onReady = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, { once: true });
    else fn();
  };
  const onLoad = (fn) => {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", fn, { once: true });
  };

  const hasGSAP = () => typeof window.gsap !== "undefined";
  const hasScrollTrigger = () => !!(window.gsap && window.ScrollTrigger);
  const registerST = () => {
    if (hasGSAP() && window.ScrollTrigger) {
      try { window.gsap.registerPlugin(window.ScrollTrigger); } catch (_) {}
    }
  };

  // ----------------------------
  // 1) Burger / mobile nav
  // ----------------------------
  function initBurgerNav() {
    const burger = qs(".burger");
    const mobileNav = qs(".mobile-nav");
    if (!burger || !mobileNav) return;

    // keep your scroll restore behavior
    if ("scrollRestoration" in history) history.scrollRestoration = "manual";
    onLoad(() => window.scrollTo(0, 0));

    burger.addEventListener("click", () => {
      const open = mobileNav.classList.toggle("is-open");
      document.body.classList.toggle("nav-open", open);
      burger.setAttribute("aria-expanded", String(open));
    });
  }

  // ----------------------------
  // 2) Smooth anchor scrolling
  // ----------------------------
  function initSmoothAnchors() {
    const anchors = qsa('a[href^="#"]');
    if (!anchors.length) return;

    anchors.forEach((a) => {
      a.addEventListener("click", function (e) {
        const href = this.getAttribute("href");
        if (!href || href === "#") return;

        const target = qs(href);
        if (!target) return; // IMPORTANT: avoid errors if id doesn't exist

        e.preventDefault();
        target.scrollIntoView({ behavior: "smooth" });
      });
    });
  }

  // ----------------------------
  // 3) Big logo -> navbar logo scroll animation (desktop only)
  // ----------------------------
  function initHeroLogoToNavLogo() {
    if (!hasGSAP()) return;

    registerST();

    onReady(() => {
      const mm = window.gsap.matchMedia?.();
      if (!mm) return;

      if (!window.matchMedia("(min-width: 1141px)").matches) return;

      const bigLogo = qs(".logo-section img");
      const navLogo = qs(".navbar_logo svg");
      const navBlock = qs(".nav-block");
      const header = qs("header");
      if (!bigLogo || !navLogo || !navBlock || !header) return;

      onLoad(() => {
        // Force header into FINAL position for measuring
        window.gsap.set(header, { y: 20 });

        const navBlockRect = navBlock.getBoundingClientRect();
        const scrollEnd = navBlockRect.top + window.scrollY;

        // Reset logo transforms before measuring
        window.gsap.set(bigLogo, { clearProps: "transform" });

        const bigRect = bigLogo.getBoundingClientRect();
        const navRect = navLogo.getBoundingClientRect();

        const scale = navRect.width / bigRect.width;
        const deltaX = navRect.left - bigRect.left;
        const deltaY = navRect.top - bigRect.top;

        // Restore INITIAL header position
        window.gsap.set(header, { y: 90 });

        // Huge logo scroll animation
        window.gsap.to(bigLogo, {
          scrollTrigger: { start: 0, end: scrollEnd, scrub: true },
          x: deltaX,
          y: deltaY,
          scale,
          ease: "none",
        });

        // Logo visibility switch
        window.ScrollTrigger?.create?.({
          start: scrollEnd,
          onEnter: () => {
            navLogo.style.opacity = "1";
            bigLogo.style.opacity = "0";
          },
          onLeaveBack: () => {
            navLogo.style.opacity = "0";
            bigLogo.style.opacity = "1";
          },
        });

        // Header movement (90px → 20px)
        window.gsap.to(header, {
          scrollTrigger: { start: 0, end: scrollEnd, scrub: true },
          y: 20,
          ease: "none",
        });
      });
    });
  }

  // ----------------------------
  // 4) Hero text lines x-offset animation (>=768)
  // ----------------------------
  function initHeroTextLines() {
    if (!hasGSAP()) return;

    registerST();

    onReady(() => {
      const mm = window.gsap.matchMedia?.();
      if (!mm) return;

      mm.add("(min-width: 768px)", () => {
        const gsap = window.gsap;
        const ScrollTrigger = window.ScrollTrigger;

        const lines = gsap.utils.toArray(".hero-text .line");
        if (!lines.length) return;

        const xValues = [-150, 0, 120];

        const create = () => {
          gsap.set(lines, { x: 0 });

          const tl = gsap.timeline({ defaults: { ease: "none" } });

          tl.to(lines, {
            x: (i) => xValues[i] ?? 0,
            duration: 1,
            stagger: 0.05, // optional
          });

          const st = ScrollTrigger.create({
            trigger: ".hero-text",
            start: "top 80%",
            end: "bottom top",
            scrub: true,
            animation: tl,
            invalidateOnRefresh: true,
          });

          ScrollTrigger.refresh();

          return () => {
            st.kill();
            tl.kill();
            gsap.set(lines, { clearProps: "x" });
          };
        };

        if (document.readyState === "complete") return create();
        window.addEventListener("load", create, { once: true });
      });
    });
  }

  // ----------------------------
  // 5) BG video fit (your existing logic, guarded)
  // ----------------------------
  function initBgVideoFit() {
    let vid_w_orig;
    let vid_h_orig;
    const min_w = 300;

    function fitVideo() {
      const video = qs("video");
      const bg = qs(".fullsize-video-bg");
      const viewport = qs("#video-viewport");
      if (!video || !viewport) return;

      if (window.matchMedia("(max-width: 1024px)").matches) {
        viewport.style.width = "";
        viewport.style.height = "";
        viewport.scrollLeft = 0;
        viewport.scrollTop = 0;

        video.style.width = "100%";
        video.style.height = "auto";
        return;
      }

      if (!bg || !vid_w_orig || !vid_h_orig) return;

      const bgWidth = bg.offsetWidth;
      const bgHeight = bg.offsetHeight;

      viewport.style.width = bgWidth + "px";
      viewport.style.height = bgHeight + "px";

      const scale_h = bgWidth / vid_w_orig;
      const scale_v = bgHeight / vid_h_orig;
      let scale = Math.max(scale_h, scale_v);

      if (scale * vid_w_orig < min_w) scale = min_w / vid_w_orig;

      const videoWidth = scale * vid_w_orig;
      const videoHeight = scale * vid_h_orig;

      video.style.width = videoWidth + "px";
      video.style.height = videoHeight + "px";

      viewport.scrollLeft = (videoWidth - bgWidth) / 2;
      viewport.scrollTop = (videoHeight - bgHeight) / 2;
    }

    onReady(() => {
      const video = qs("video");
      if (!video) return;

      // Only if width/height attributes exist
      const wAttr = video.getAttribute("width");
      const hAttr = video.getAttribute("height");
      if (!wAttr || !hAttr) return;

      vid_w_orig = parseInt(wAttr, 10);
      vid_h_orig = parseInt(hAttr, 10);

      window.addEventListener("resize", fitVideo);
      fitVideo();
    });
  }

  // ----------------------------
  // 6) Services image crossfade (guarded)
  // ----------------------------
  function initServicesCrossFade() {
    const sections = qsa('.service-subsection[data-img]');
    const imgA = qs("#servicesImgA");
    const imgB = qs("#servicesImgB");
    if (!sections.length || !imgA || !imgB) return;

    let activeImg = imgA;
    let inactiveImg = imgB;
    let currentSrc = activeImg.src;
    let isAnimating = false;

    function crossFade(nextSrc) {
      if (!nextSrc || nextSrc === currentSrc || isAnimating) return;

      isAnimating = true;
      inactiveImg.src = nextSrc;

      const startFade = () => {
        inactiveImg.classList.add("is-active");
        activeImg.classList.remove("is-active");

        setTimeout(() => {
          [activeImg, inactiveImg] = [inactiveImg, activeImg];
          currentSrc = nextSrc;
          isAnimating = false;
        }, 400);
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
      { threshold: [0, 0.5, 0.75, 1] }
    );

    sections.forEach((s) => observer.observe(s));
  }

  // ----------------------------
  // 7) Hero pin: enlarging text + floating logos (GSAP, guarded)
  // ----------------------------
  function initHeroPin() {
    if (!hasGSAP()) return;

    registerST();

    onLoad(() => {
      const section = qs(".hero-pin");
      if (!section) return;

      const text = qs(".enlarging-text", section);
      const logos = window.gsap.utils.toArray?.(".hero-pin .logo") ?? [];
      if (!text || !logos.length) return;

      const vh = () => window.innerHeight;

      const clampPx = (min, fluid, max) => Math.min(max, Math.max(min, fluid));
      const fluidPx = (minPx, maxPx, minVw = 320, maxVw = 1920) => {
        const vw = window.innerWidth;
        const t = (vw - minVw) / (maxVw - minVw);
        return clampPx(minPx, minPx + (maxPx - minPx) * t, maxPx);
      };

      const getMinFontPx = () => {
        const w = window.innerWidth;
        if (w <= 767) return 32;
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

      const mm = window.gsap.matchMedia?.();
      if (!mm) return;

      mm.add(
        { mobile: "(max-width: 767px)", desktop: "(min-width: 768px)" },
        (context) => {
          const { mobile } = context.conditions;

          window.ScrollTrigger?.getAll?.().forEach((st) => st.kill());
          window.gsap.killTweensOf([section, text, logos]);

          window.gsap.set(section, { clearProps: "transform" });
          window.gsap.set(text, { clearProps: "fontSize,transform" });
          window.gsap.set(logos, { clearProps: "transform,opacity,willChange" });

          if (mobile) {
            window.gsap.set(logos, { y: 0, opacity: 1, willChange: "auto" });
            return;
          }

          const baseStart = vh() * 1.2;
          const startOffsets = [+0.15, -0.25, +0.1, -0.2];
          const speeds = [1.1, 1.0, 1.6, 2.2];

          logos.forEach((el, i) => {
            const offset = startOffsets[i] ?? 0;
            const speed = speeds[i] ?? 1;
            el.dataset.speed = String(speed);

            window.gsap.set(el, {
              y: baseStart + vh() * offset,
              opacity: 0,
              willChange: "transform,opacity",
            });
          });

          const fontSizes = getTextSizes();

          const tl = window.gsap.timeline({
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

          tl.fromTo(text, { fontSize: fontSizes.from }, { fontSize: fontSizes.to, ease: "none", duration: 1 });
          tl.to(logos, { opacity: 1, duration: 0.15, stagger: 0.03, ease: "none" }, ">");

          const baseTravel = vh() * 3.5;
          logos.forEach((el) => {
            const startY = window.gsap.getProperty(el, "y");
            const speed = Number(el.dataset.speed);

            tl.to(el, { y: startY - baseTravel * speed, ease: "none", duration: 2 }, "<");
          });

          window.ScrollTrigger?.refresh?.();
        }
      );
    });
  }

  // ----------------------------
  // 8) Clients rows active state (guarded)
  // ----------------------------
  function initClientsRows() {
    onReady(() => {
      const rows = qsa(".clients-row");
      if (!rows.length) return;

      const setActive = (row) => rows.forEach((r) => r.classList.toggle("is-active", r === row));
      setActive(rows[0]);

      const isFinePointer = window.matchMedia?.("(hover: hover) and (pointer: fine)")?.matches;

      rows.forEach((row) => {
        if (isFinePointer) row.addEventListener("pointerenter", () => setActive(row));
        row.addEventListener("pointerup", (e) => {
          e.preventDefault?.();
          setActive(row);
        });
      });
    });
  }

  // ----------------------------
  // 9) Footer logo expand at page end (guarded)
  // ----------------------------
  function initFooterExpandOnEnd() {
    const wrapper = qs(".footer-logo_wrapper");
    if (!wrapper) return;

    let expanded = false;

    function atPageEnd() {
      return window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    }

    function onScroll() {
      if (expanded) return;
      if (atPageEnd()) {
        wrapper.classList.add("is-expanded");
        expanded = true;
        window.removeEventListener("scroll", onScroll);
      }
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // ----------------------------
  // 10) Parallax fullsize image + Swiper (guarded)
  // ----------------------------
  function initParallaxAndReviewsSwiper() {
    if (!hasGSAP()) return;

    registerST();

    onLoad(() => {
      const section = qs(".fullsize-image.parallax");
      const img = qs(".fullsize-image.parallax .parallax-img");
      if (section && img && hasScrollTrigger()) {
        window.ScrollTrigger.getById?.("photoSlow")?.kill?.();
        window.gsap.killTweensOf(img);

        window.gsap.fromTo(
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
            },
          }
        );

        window.ScrollTrigger.refresh?.();
      }

      // Swiper part (only if present)
      if (typeof window.Swiper === "undefined") return;
      const swiperEl = qs(".reviews-swiper");
      if (!swiperEl) return;

      const swiper = new window.Swiper(".reviews-swiper", {
        slidesPerView: 1,
        spaceBetween: 10,
        initialSlide: 1,
        centeredSlides: true,
        navigation: {
          nextEl: ".swiper-next",
          prevEl: ".swiper-prev",
        },
      });

      function setStartSlide() {
        const idx = window.innerWidth < 786 ? 0 : 1;
        swiper.update();
        requestAnimationFrame(() => swiper.slideTo(idx, 0));
      }

      setStartSlide();
      swiper.on("breakpoint", setStartSlide);
    });
  }

  // ----------------------------
  // 11) Wheel/touch snap between logo section and main content (guarded)
  // ----------------------------
  function initSnapScrollLogoToMain() {
    const logo = qs(".logo-section");
    const main = qs("#main-content");
    if (!logo || !main) return;

    let locked = false;
    let logoTop = 0;
    let mainTop = 0;

    const EPS = 2;
    const SNAP_DURATION = 1000; // ms
    const EASING = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

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
        if (t < 1) requestAnimationFrame(frame);
        else locked = false;
      }

      requestAnimationFrame(frame);
    }

    refreshAnchors();
    window.addEventListener("resize", refreshAnchors);
    new ResizeObserver(refreshAnchors).observe(document.body);

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
  }

  // ----------------------------
  // 12) Reveal lines split + intersection observer (guarded)
  // ----------------------------
  function initRevealLines() {
    function splitToLines(el) {
      if (!el.dataset.original) el.dataset.original = el.innerHTML;
      el.innerHTML = el.dataset.original;

      const words = el.textContent.trim().split(/\s+/);
      el.textContent = "";

      const wordSpans = words.map((word, i) => {
        const span = document.createElement("span");
        span.textContent = word + (i < words.length - 1 ? " " : "");
        span.style.display = "inline";
        el.appendChild(span);
        return span;
      });

      const lines = [];
      let currentLineTop = null;
      let currentLine = [];

      wordSpans.forEach((span) => {
        const top = span.offsetTop;

        if (currentLineTop === null) currentLineTop = top;
        if (top !== currentLineTop) {
          lines.push(currentLine);
          currentLine = [];
          currentLineTop = top;
        }
        currentLine.push(span);
      });

      if (currentLine.length) lines.push(currentLine);

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
      const items = qsa("[data-reveal]");
      if (!items.length) return;

      items.forEach(splitToLines);

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            entry.target.classList.add("is-inview");
            io.unobserve(entry.target);
          });
        },
        { threshold: 0.2 }
      );

      items.forEach((el) => io.observe(el));

      let rAF = null;
      window.addEventListener("resize", () => {
        cancelAnimationFrame(rAF);
        rAF = requestAnimationFrame(() => {
          items.forEach((el) => {
            const was = el.classList.contains("is-inview");
            splitToLines(el);
            if (was) el.classList.add("is-inview");
          });
        });
      });
    }

    onReady(setupReveal);
  }

  // ----------------------------
  // 13) Marquee distance CSS var (guarded)
  // ----------------------------
  function initMarqueeDistance() {
    const track = qs(".marquee__track");
    const first = track ? qs(".marquee__content", track) : null;
    if (!track || !first) return;

    function setDistance() {
      const w = Math.ceil(first.getBoundingClientRect().width);
      track.style.setProperty("--marquee-distance", w);
    }

    window.addEventListener("load", setDistance);

    if (typeof ResizeObserver !== "undefined") {
      new ResizeObserver(setDistance).observe(first);
    } else {
      window.addEventListener("resize", setDistance);
    }
  }

  // ----------------------------
  // 14) Team page: pinned section inner scroll (guarded, from team-js.js)
  // ----------------------------
  function initTeamPinnedSection() {
    if (!hasGSAP()) return;
    registerST();

    const section = qs("#pinSection");
    const img = qs("#pinImage");
    const inner = qs("#innerBlock");
    if (!section || !img || !inner || !hasScrollTrigger()) return;

    let st;

    function setSectionHeightToImage() {
      const h = img.getBoundingClientRect().height;
      section.style.height = `${h}px`;
    }

    function buildScroll() {
      if (st) st.kill(true);

      gsap.set(inner, { clearProps: "y" });

      const sectionH = section.getBoundingClientRect().height;
      const innerH = inner.getBoundingClientRect().height;

      const extra = 24;
      const travel = innerH + extra;

      st = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: () => "+=" + travel,
          scrub: true,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      }).to(inner, { y: -travel, ease: "none" }, 0);
    }

    function refreshAll() {
      setSectionHeightToImage();
      buildScroll();
      ScrollTrigger.refresh();
    }

    if (img.complete) refreshAll();
    else img.addEventListener("load", refreshAll, { once: true });

    window.addEventListener("resize", refreshAll);
  }

  // ----------------------------
  // 15) Fade in on view (team + values) guarded
  // ----------------------------
  function initFadeInOnView() {
    function fadeInOnView({ container, itemSelector, stagger = 120, baseDelay = 0, threshold = 0.35, once = true }) {
      const root = qs(container);
      if (!root) return;

      const items = qsa(itemSelector, root);
      if (!items.length) return;

      let batch = [];
      let rafId = null;

      function flush() {
        rafId = null;

        batch
          .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)
          .forEach((el, i) => {
            el.style.setProperty("--inview-delay", `${baseDelay + i * stagger}ms`);
            el.classList.add("is-inview");
          });

        batch = [];
      }

      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const el = entry.target;
            if (once) io.unobserve(el);
            batch.push(el);
            if (!rafId) rafId = requestAnimationFrame(flush);
          });
        },
        { threshold }
      );

      items.forEach((el) => io.observe(el));
    }

    // Team items fade in
    fadeInOnView({ container: ".team-grid", itemSelector: ".fade-item", stagger: 120 });

    // Values items fade in
    fadeInOnView({ container: ".values-wrapper", itemSelector: ".fade-item", stagger: 80, threshold: 0.5 });
  }

  // ----------------------------
  // Run all inits (safe no-ops if absent)
  // ----------------------------
  initBurgerNav();
  initSmoothAnchors();
  initHeroLogoToNavLogo();
  initHeroTextLines();
  initBgVideoFit();
  initServicesCrossFade();
  initHeroPin();
  initClientsRows();
  initFooterExpandOnEnd();
  initParallaxAndReviewsSwiper();
  initSnapScrollLogoToMain();
  initRevealLines();
  initMarqueeDistance();
  initTeamPinnedSection();
  initFadeInOnView();
})();
