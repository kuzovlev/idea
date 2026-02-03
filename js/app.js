(() => {
  // ----------------------------
  // Small helpers
  // ----------------------------
  const qs = (sel, root = document) => root.querySelector(sel);
  const qsa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  const onReady = (fn) => {
    if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", fn, {once: true});
    else fn();
  };
  const onLoad = (fn) => {
    if (document.readyState === "complete") fn();
    else window.addEventListener("load", fn, {once: true});
  };

  const hasGSAP = () => typeof window.gsap !== "undefined";
  const hasScrollTrigger = () => !!(window.gsap && window.ScrollTrigger);
  const registerST = () => {
    if (hasGSAP() && window.ScrollTrigger) {
      try {
        window.gsap.registerPlugin(window.ScrollTrigger);
      } catch (_) {
      }
    }
  };
  // ----------------------------
// 0) Page Loader (footer HTML + % counter + slides up after 100%)
// ----------------------------
  function initPageLoader() {
    const overlay = qs("#page-loader");
    if (!overlay) return;

    const percentEl = qs("#loaderPercent", overlay);
    if (!percentEl) return;

    // Prevent double init
    if (overlay.dataset.loaderInit === "1") return;
    overlay.dataset.loaderInit = "1";

    // Lock scroll while loading
    const prevOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";

    // Ensure it's visible initially (in case CSS hides it by default)
    overlay.style.transform = "translateY(0)";
    overlay.style.pointerEvents = "all";

    const imgs = Array.from(document.images || []);
    const total = Math.max(1, imgs.length);

    let loaded = 0;
    let target = 0;
    let current = 0;
    let hardDone = false;
    let finished = false;

    const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

    function computeTarget() {
      const real = (loaded / total) * 100;
      // keep it under 99 until the real window "load" fires
      const capped = hardDone ? 100 : Math.min(real, 99);
      target = Math.max(target, capped);
    }

    function tick() {
      current += (target - current) * 0.08;

      // When load fired, force finish
      if (hardDone) {
        target = 100;
        if (100 - current < 0.6) current = 100;
      }

      const shown = Math.floor(clamp(current, 0, 100));
      percentEl.textContent = String(shown);

      if (!finished && hardDone && shown >= 100) {
        finished = true;
        finish();
        return;
      }
      requestAnimationFrame(tick);
    }

    function finish() {
      const navBlock = qs(".nav-block");

      const cleanup = () => {
        document.documentElement.style.overflow = prevOverflow || "";
        document.body.classList.add("is-loaded");

        // show navbar
        if (navBlock) {
          navBlock.style.opacity = "1";
        }

        overlay.remove();
      };

      if (hasGSAP()) {
        window.gsap.to(overlay, {
          yPercent: -110,
          duration: 0.7,
          ease: "power3.inOut",
          onComplete: cleanup,
        });
      } else {
        overlay.style.transition = "transform 700ms cubic-bezier(.22,.61,.36,1)";
        overlay.style.transform = "translateY(-110%)";
        overlay.addEventListener("transitionend", cleanup, {once: true});
      }
    }

    function markOne() {
      loaded += 1;
      computeTarget();
    }

    // Track images already in DOM
    imgs.forEach((img) => {
      if (img.complete && img.naturalWidth > 0) {
        markOne();
        return;
      }
      img.addEventListener("load", markOne, {once: true});
      img.addEventListener("error", markOne, {once: true});
    });

    computeTarget();
    requestAnimationFrame(tick);

    // This is what unlocks 100% reliably
    onLoad(() => {
      hardDone = true;
      target = 100;
    });

    // Safety: never get stuck at 99 if load is delayed by something external
    window.setTimeout(() => {
      if (finished) return;
      hardDone = true;
      target = 100;
    }, 8000);
  }

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
        target.scrollIntoView({behavior: "smooth"});
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
      if (!window.matchMedia("(min-width: 1141px)").matches) return;

      const gsap = window.gsap;
      const ScrollTrigger = window.ScrollTrigger;

      const bigLogo = qs(".logo-section img");
      const navLogo = qs(".navbar_logo svg");
      const navBlock = qs(".nav-block");
      const header = qs("header");
      if (!bigLogo || !navLogo || !navBlock || !header || !ScrollTrigger) return;

      const waitFonts = () =>
        document.fonts?.ready ? document.fonts.ready.catch(() => {}) : Promise.resolve();
      const waitImage = (img) => {
        if (!img) return Promise.resolve();
        if (img.complete && img.naturalWidth) return Promise.resolve();
        return new Promise((res) => img.addEventListener("load", res, { once: true }));
      };

      const nextLayout = () =>
        new Promise((res) => requestAnimationFrame(() => requestAnimationFrame(res)));

      onLoad(async () => {
        await Promise.all([waitFonts(), waitImage(bigLogo)]);

        let tl;

        const build = () => {
          tl?.kill();
          ScrollTrigger.getById("heroLogoToNav")?.kill();

          gsap.set([bigLogo, navLogo], { clearProps: "opacity,visibility" });
          const headerStartY = Number(gsap.getProperty(header, "y")) || 0;
          const headerEndY = 20;

          gsap.set(bigLogo, { clearProps: "transform" });

          gsap.set(header, { y: headerEndY });
          const bigRect = bigLogo.getBoundingClientRect();
          const navRect = navLogo.getBoundingClientRect();

          if (!bigRect.width || !navRect.width) {
            gsap.set(header, { y: headerStartY });
            return;
          }

          const scale = navRect.width / bigRect.width;
          const deltaX = navRect.left - bigRect.left;
          const deltaY = navRect.top - bigRect.top;

          gsap.set(header, { y: headerStartY });

          const scrollEnd = navBlock.getBoundingClientRect().top + window.scrollY;

          const setBigOpacity = gsap.quickSetter(bigLogo, "opacity");
          const setNavOpacity = gsap.quickSetter(navLogo, "opacity");

          const applyVisibility = (progress) => {
            const showNav = progress >= 0.98;
            setNavOpacity(showNav ? 1 : 0);
            setBigOpacity(showNav ? 0 : 1);
          };

          tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              id: "heroLogoToNav",
              trigger: document.documentElement,
              start: 0,
              end: scrollEnd,
              scrub: true,
              invalidateOnRefresh: true,
              onUpdate: (self) => applyVisibility(self.progress),
              onRefresh: (self) => applyVisibility(self.progress),
            },
          });

          applyVisibility(tl.scrollTrigger.progress);

          tl.to(bigLogo, { x: deltaX, y: deltaY, scale }, 0);
          tl.to(header, { y: headerEndY }, 0);
        };

        await nextLayout();
        build();
        ScrollTrigger.refresh();
        ScrollTrigger.addEventListener("refreshInit", build);

        let resizeTimer;
        const onResize = () => {
          clearTimeout(resizeTimer);
          resizeTimer = setTimeout(async () => {
            await nextLayout();
            build();
            ScrollTrigger.refresh();
          }, 150);
        };

        window.addEventListener("resize", onResize);
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
          gsap.set(lines, {x: 0});

          const tl = gsap.timeline({defaults: {ease: "none"}});

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
            gsap.set(lines, {clearProps: "x"});
          };
        };

        if (document.readyState === "complete") return create();
        window.addEventListener("load", create, {once: true});
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
    let currentSrc = null;
    let isAnimating = false;
    let lastScrollY = window.scrollY;
    let lastSectionIndex = 0;
    let isInitialized = false;

    function initializeImage() {
      const visible = Array.from(sections).find((section) => {
        const rect = section.getBoundingClientRect();
        return rect.top < window.innerHeight * 0.75 && rect.bottom > window.innerHeight * 0.25;
      });

      if (visible) {
        const initialSrc = visible.dataset.img;
        activeImg.src = initialSrc;
        currentSrc = initialSrc;
        lastSectionIndex = Array.from(sections).indexOf(visible);
      } else {
        const lastSection = sections[sections.length - 1];
        const lastRect = lastSection.getBoundingClientRect();

        if (lastRect.bottom < 0) {
          const initialSrc = lastSection.dataset.img;
          activeImg.src = initialSrc;
          currentSrc = initialSrc;
          lastSectionIndex = sections.length - 1;
        } else {
          currentSrc = activeImg.src;
          lastSectionIndex = 0;
        }
      }

      isInitialized = true;
    }

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
        if (!isInitialized) return;

        const visible = entries
          .filter((e) => e.isIntersecting && e.intersectionRatio >= 0.5);

        const currentScrollY = window.scrollY;
        const scrollingDown = currentScrollY > lastScrollY;
        lastScrollY = currentScrollY;

        if (!visible.length) return;

        let topSection;
        if (scrollingDown) {
          topSection = visible.sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0].target;
        } else {
          const currentSection = sections[lastSectionIndex];
          const currentEntry = entries.find(e => e.target === currentSection);
          const currentRatio = currentEntry?.intersectionRatio || 0;

          const previousSections = visible
            .filter(e => {
              const idx = Array.from(sections).indexOf(e.target);
              return idx < lastSectionIndex;
            })
            .sort((a, b) => {
              const indexA = Array.from(sections).indexOf(a.target);
              const indexB = Array.from(sections).indexOf(b.target);
              return indexB - indexA; // Highest index first (closest previous)
            });

          if (previousSections.length && previousSections[0].intersectionRatio > currentRatio) {
            topSection = previousSections[0].target;
          } else {
            return;
          }
        }

        const topSectionIndex = Array.from(sections).indexOf(topSection);

        if (Math.abs(topSectionIndex - lastSectionIndex) > 1) return;

        lastSectionIndex = topSectionIndex;
        crossFade(topSection.dataset.img);
      },
      {threshold: [0, 0.5, 0.75, 1]}
    );

    initializeImage();
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
        {mobile: "(max-width: 767px)", desktop: "(min-width: 768px)"},
        (context) => {
          const {mobile} = context.conditions;

          window.ScrollTrigger?.getAll?.().forEach((st) => st.kill());
          window.gsap.killTweensOf([section, text, logos]);

          window.gsap.set(section, {clearProps: "transform"});
          window.gsap.set(text, {clearProps: "fontSize,transform"});
          window.gsap.set(logos, {clearProps: "transform,opacity,willChange"});

          if (mobile) {
            window.gsap.set(logos, {y: 0, opacity: 1, willChange: "auto"});
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

          tl.fromTo(text, {fontSize: fontSizes.from}, {fontSize: fontSizes.to, ease: "none", duration: 1});
          tl.to(logos, {opacity: 1, duration: 0.15, stagger: 0.03, ease: "none"}, ">");

          const baseTravel = vh() * 3.5;
          logos.forEach((el) => {
            const startY = window.gsap.getProperty(el, "y");
            const speed = Number(el.dataset.speed);

            tl.to(el, {y: startY - baseTravel * speed, ease: "none", duration: 2}, "<");
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

    window.addEventListener("scroll", onScroll, {passive: true});
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
          {y: "-26%"},
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
      {passive: false}
    );

    let startY = null;
    window.addEventListener("touchstart", (e) => {
      startY = e.touches[0]?.clientY ?? null;
    }, {passive: true});

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
      {passive: false}
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
        {threshold: 0.2}
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

    let tl = null;
    let resizeTimer = null;

    const mobileBlock = qs(".injection-item"); // your existing HTML block
    let homeAnchor = null;

    function ensureHomeAnchor() {
      if (!mobileBlock || homeAnchor) return;
      homeAnchor = document.createComment("injection-item-home");
      mobileBlock.parentNode.insertBefore(homeAnchor, mobileBlock);
    }

    function isMobile() {
      return window.matchMedia("(max-width: 767px)").matches;
    }

    function placeInsideSpacerAfterSection() {
      if (!mobileBlock || !section) return;

      ensureHomeAnchor();

      if (!isMobile()) {
        if (homeAnchor?.parentNode) {
          homeAnchor.parentNode.insertBefore(mobileBlock, homeAnchor.nextSibling);
        }
        return;
      }

      const spacer =
        tl?.scrollTrigger?.pinSpacer ||
        (section.parentElement?.classList?.contains("pin-spacer") ? section.parentElement : null);

      if (!spacer) return;

      spacer.insertBefore(mobileBlock, section.nextSibling);
    }

    function placeAfterRefresh() {
      requestAnimationFrame(() => requestAnimationFrame(placeInsideSpacerAfterSection));
    }

    // ===== GSAP / ST lifecycle =====
    function killTL() {
      if (!tl) return;
      tl.scrollTrigger?.kill(true);
      tl.kill();
      tl = null;

      section.style.removeProperty("height");
      gsap.set(inner, {clearProps: "transform"});
    }

    function setSectionHeightToImage() {
      const h = img.offsetHeight || img.getBoundingClientRect().height;
      section.style.height = `${Math.max(1, h)}px`;
    }

    function buildScroll() {
      killTL();

      setSectionHeightToImage();

      const innerH = inner.getBoundingClientRect().height;
      const extra = 24;
      const travel = innerH + extra;

      tl = gsap.timeline({
        scrollTrigger: {
          id: "teamPin",
          trigger: section,
          start: "top top",
          end: () => "+=" + travel,
          scrub: true,
          pin: true,
          pinSpacing: true,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          pinType: ScrollTrigger.isTouch ? "transform" : "fixed",
        },
      }).to(inner, {y: -travel, ease: "none"}, 0);

      placeAfterRefresh();
    }

    function refreshAllDebounced() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        buildScroll();
        ScrollTrigger.refresh();
        placeAfterRefresh();
      }, 150);
    }

    ScrollTrigger.addEventListener("refresh", placeAfterRefresh);

    if (img.complete) {
      buildScroll();
      ScrollTrigger.refresh();
      placeAfterRefresh();
    } else {
      img.addEventListener(
        "load",
        () => {
          buildScroll();
          ScrollTrigger.refresh();
          placeAfterRefresh();
        },
        {once: true}
      );
    }

    window.addEventListener("resize", refreshAllDebounced);
    window.addEventListener("resize", placeAfterRefresh);

    return () => {
      window.removeEventListener("resize", refreshAllDebounced);
      window.removeEventListener("resize", placeAfterRefresh);

      ScrollTrigger.removeEventListener("refresh", placeAfterRefresh);

      if (mobileBlock && homeAnchor?.parentNode) {
        homeAnchor.parentNode.insertBefore(mobileBlock, homeAnchor.nextSibling);
      }

      killTL();
    };
  }

  // ----------------------------
  // 15) Fade in on view (team + values) guarded
  // ----------------------------
  function initFadeInOnView() {
    function fadeInOnView({container, itemSelector, stagger = 120, baseDelay = 0, threshold = 0.35, once = true}) {
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
        {threshold}
      );

      items.forEach((el) => io.observe(el));
    }

    // Team items fade in
    fadeInOnView({container: ".team-grid", itemSelector: ".fade-item", stagger: 120});

    // Values items fade in
    fadeInOnView({container: ".values-wrapper", itemSelector: ".fade-item", stagger: 80, threshold: 0.5});
  }

  // ----------------------------
  // 16) Tracking mouse on video section
  // ----------------------------
  function initTrackingMouseOnVideo() {
    if (window.matchMedia("(max-width: 1024px)").matches) return;
    const section = document.querySelector('.fullsize-video-bg, .team_video-section');
    const button = section.querySelector('.video-play');

    if (!section || !button) return;

    section.addEventListener('mousemove', (e) => {
      const rect = section.getBoundingClientRect();

      button.style.left = `${e.clientX - rect.left}px`;
      button.style.top = `${e.clientY - rect.top}px`;
    });
  }

  // ----------------------------
  // Run all inits (safe no-ops if absent)
  // ----------------------------
  initPageLoader();
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
  initTrackingMouseOnVideo();
})();

document.addEventListener('DOMContentLoaded', () => {
  const form = document.querySelector('.contact-form');
  const submitBtn = document.querySelector('.submit-form');

  const modal = document.getElementById('formSuccessModal');
  let autoCloseTimer = null;

  function openModal() {
    if (!modal) return;

    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');

    // optional auto-close
    clearTimeout(autoCloseTimer);
    autoCloseTimer = setTimeout(() => closeModal(), 3500);
  }

  function closeModal() {
    if (!modal) return;

    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    clearTimeout(autoCloseTimer);
  }

  // close handlers (click outside / button / X)
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target && e.target.dataset && e.target.dataset.close === 'true') {
        closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && modal.classList.contains('is-open')) closeModal();
    });
  }

  submitBtn?.addEventListener('click', async () => {
    if (!form) return;

    const formData = new FormData(form);
    formData.append('action', 'submit_contact_form');

    submitBtn.classList.add('is-loading');
    submitBtn.style.pointerEvents = 'none';

    try {
      const res = await fetch('/wp-admin/admin-ajax.php', {
        method: 'POST',
        body: formData
      });

      const data = await res.json();

      if (data.success) {
        form.reset();
        openModal();
      } else {
        alert('Помилка. Спробуйте ще раз.');
      }
    } catch (err) {
      alert('Помилка зʼєднання.');
    } finally {
      submitBtn.classList.remove('is-loading');
      submitBtn.style.pointerEvents = '';
    }
  });
});

function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS
}

const videobtn = document.querySelector('.video-play');
 // = document.querySelector('.bg-video');

videobtn.addEventListener('click', (e) => {
  // Stop background while playing the main video
  // bgVideo.pause();
  const bgVideo = e.target.closest('section').querySelector('video');
  const src = bgVideo.querySelector('source').src;
  console.log(isIOS());
  if (isIOS()) {
    // iOS: use native fullscreen player
    const v = document.createElement('video');
    v.src = src;
    v.controls = true;
    v.playsInline = false; // allow fullscreen
    v.setAttribute('playsinline', ''); // harmless; iOS still can fullscreen from user gesture
    v.setAttribute('webkit-playsinline', '');
    document.body.appendChild(v);

    // On iOS, play() from a click is allowed and typically triggers native player
    v.play().catch(() => {});

    // Cleanup after leaving player (best-effort)
    v.addEventListener('ended', () => {
      v.remove();
      bgVideo.play().catch(() => {});
    });
    v.addEventListener('pause', () => {
      // user may exit fullscreen by pausing; cleanup
      setTimeout(() => {
        if (!document.body.contains(v)) return;
        v.remove();
        bgVideo.play().catch(() => {});
      }, 300);
    });

  } else {
    // Desktop/Android: open your custom modal
    openModalWithVideo(src);
  }
});

const modal = document.querySelector('.video-modal');
const modalVideo = modal.querySelector('video');
const closeBtn = document.querySelector('.video-modal__close');
const backdrop = document.querySelector('.video-modal__backdrop');
console.log(modal, modalVideo, closeBtn, backdrop);
function openModalWithVideo(url) {
  modal.hidden = false;
  modal
  modalVideo.src = url;
  modalVideo.currentTime = 0;
  modalVideo.play().catch(() => {});
}

function closeModal() {
  modalVideo.pause();
  modalVideo.removeAttribute('src');
  modalVideo.load();
  modal.hidden = true;
  bgVideo.play().catch(() => {});
}

closeBtn.addEventListener('click', closeModal);
backdrop.addEventListener('click', closeModal);
