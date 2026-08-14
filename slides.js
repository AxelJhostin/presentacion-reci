(() => {
  const slides = [...document.querySelectorAll('.slide')];
  const progress = document.querySelector('.deck-progress');
  const navLinks = [...document.querySelectorAll('.deck-header a[href^="#"]')];
  const total = slides.length;
  let current = Math.max(0, slides.findIndex((slide) => slide.classList.contains('is-active')));
  let wheelLocked = false;
  let touchStartX = 0;

  function render(nextIndex, { updateHash = true, focus = false } = {}) {
    const safeIndex = Math.max(0, Math.min(total - 1, nextIndex));
    const direction = safeIndex === current ? 0 : safeIndex > current ? 1 : -1;

    slides.forEach((slide, index) => {
      slide.classList.toggle('is-active', index === safeIndex);
      slide.classList.toggle('is-before', direction > 0 ? index < safeIndex : index <= safeIndex && index !== safeIndex);
      slide.classList.toggle('is-after', direction < 0 ? index > safeIndex : index >= safeIndex && index !== safeIndex);
      slide.setAttribute('aria-hidden', index === safeIndex ? 'false' : 'true');
    });

    current = safeIndex;
    // Evita que una URL con hash desplace horizontalmente la lámina durante
    // la animación inicial. El escenario debe permanecer fijo en 16:9.
    window.scrollTo(0, 0);
    progress.textContent = `${current + 1} / ${total}`;
    navLinks.forEach((link) => link.toggleAttribute('aria-current', link.getAttribute('href') === `#${slides[current].id}`));
    if (updateHash) history.replaceState(null, '', `#${slides[current].id}`);
    if (focus) slides[current].focus({ preventScroll: true });
  }

  function navigate(delta) { render(current + delta, { focus: true }); }

  document.querySelector('[data-action="previous"]').addEventListener('click', () => navigate(-1));
  document.querySelector('[data-action="next"]').addEventListener('click', () => navigate(1));

  navLinks.forEach((link) => link.addEventListener('click', (event) => {
    event.preventDefault();
    render(slides.findIndex((slide) => `#${slide.id}` === link.getAttribute('href')), { focus: true });
  }));

  window.addEventListener('keydown', (event) => {
    if (['ArrowRight', 'ArrowDown', 'PageDown', ' '].includes(event.key)) { event.preventDefault(); navigate(1); }
    if (['ArrowLeft', 'ArrowUp', 'PageUp'].includes(event.key)) { event.preventDefault(); navigate(-1); }
    if (event.key === 'Home') { event.preventDefault(); render(0, { focus: true }); }
    if (event.key === 'End') { event.preventDefault(); render(total - 1, { focus: true }); }
  });

  window.addEventListener('wheel', (event) => {
    if (wheelLocked || Math.abs(event.deltaY) < 16) return;
    wheelLocked = true;
    navigate(event.deltaY > 0 ? 1 : -1);
    window.setTimeout(() => { wheelLocked = false; }, 650);
  }, { passive: true });

  window.addEventListener('touchstart', (event) => { touchStartX = event.changedTouches[0].screenX; }, { passive: true });
  window.addEventListener('touchend', (event) => {
    const distance = event.changedTouches[0].screenX - touchStartX;
    if (Math.abs(distance) > 45) navigate(distance < 0 ? 1 : -1);
  }, { passive: true });

  window.addEventListener('hashchange', () => {
    const requested = slides.findIndex((slide) => `#${slide.id}` === window.location.hash);
    if (requested >= 0 && requested !== current) render(requested, { updateHash: false });
  });

  const requested = slides.findIndex((slide) => `#${slide.id}` === window.location.hash);
  render(requested >= 0 ? requested : 0, { updateHash: requested < 0 });
})();
