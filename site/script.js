(() => {
  'use strict';

  document.getElementById('footerYear').textContent = new Date().getFullYear();

  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---- Sticky-nav scroll spy -------------------------------------------- */
  const navLinks = Array.from(document.querySelectorAll('[data-nav]'));
  const sections = navLinks
    .map((link) => document.querySelector(link.getAttribute('href')))
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    const setActive = (id) => {
      navLinks.forEach((link) => {
        link.classList.toggle('is-active', link.getAttribute('href') === `#${id}`);
      });
    };

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: '-45% 0px -45% 0px' }
    );

    sections.forEach((section) => observer.observe(section));
  }

  /* ---- Gallery carousel (mobile) ---------------------------------------- */
  const track = document.getElementById('galeriaTrack');
  const dotsContainer = document.getElementById('galeriaDots');

  if (track && dotsContainer) {
    const tiles = Array.from(track.children);

    tiles.forEach((_, index) => {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.className = 'gallery-dot';
      dot.setAttribute('role', 'tab');
      dot.setAttribute('aria-label', `Ir para foto ${index + 1}`);
      dot.addEventListener('click', () => goToSlide(index, true));
      dotsContainer.appendChild(dot);
    });

    const dots = Array.from(dotsContainer.children);
    let current = 0;
    let autoplayTimer = null;

    function setActiveDot(index) {
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === index));
      current = index;
    }

    function goToSlide(index, userInitiated) {
      const tile = tiles[index];
      if (!tile) return;
      track.scrollTo({ left: tile.offsetLeft, behavior: prefersReducedMotion ? 'auto' : 'smooth' });
      setActiveDot(index);
      if (userInitiated) restartAutoplay();
    }

    function startAutoplay() {
      if (prefersReducedMotion) return; // respects reduced-motion: no forced auto-advance
      autoplayTimer = window.setInterval(() => {
        goToSlide((current + 1) % tiles.length, false);
      }, 4000);
    }

    function restartAutoplay() {
      window.clearInterval(autoplayTimer);
      startAutoplay();
    }

    // Keep the active dot in sync when the user swipes manually.
    let scrollDebounce = null;
    track.addEventListener('scroll', () => {
      window.clearTimeout(scrollDebounce);
      scrollDebounce = window.setTimeout(() => {
        const index = Math.round(track.scrollLeft / track.clientWidth);
        setActiveDot(Math.min(index, tiles.length - 1));
      }, 100);
    });

    // Pause autoplay while the user is actively interacting with the track.
    track.addEventListener('pointerdown', () => window.clearInterval(autoplayTimer));
    track.addEventListener('pointerup', restartAutoplay);

    setActiveDot(0);
    startAutoplay();
  }

  /* ---- Contact form (no backend wired up yet — see site/README.md) ------ */
  const form = document.getElementById('contactForm');
  const success = document.getElementById('formSuccess');

  if (form && success) {
    form.addEventListener('submit', (event) => {
      event.preventDefault();
      form.hidden = true;
      success.hidden = false;
      success.focus();
    });
  }
})();
