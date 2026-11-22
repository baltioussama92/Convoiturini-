(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (!reduced && matchMedia('(pointer:fine)').matches) {
    const glow = document.createElement('div');
    glow.className = 'cursor-glow';
    document.body.append(glow);
    addEventListener('pointermove', event => {
      glow.style.left = `${event.clientX}px`;
      glow.style.top = `${event.clientY}px`;
    });
  }
  document.querySelectorAll('.button,.swap-button,.route-card').forEach(element => {
    element.addEventListener('pointermove', event => {
      if (reduced || !element.classList.contains('magnetic')) return;
      const rect = element.getBoundingClientRect();
      element.style.transform = `translate(${(event.clientX - rect.left - rect.width / 2) * .08}px, ${(event.clientY - rect.top - rect.height / 2) * .08}px)`;
    });
    element.addEventListener('pointerleave', () => { element.style.transform = ''; });
    element.addEventListener('click', event => {
      const rect = element.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      ripple.style.left = `${event.clientX - rect.left}px`;
      ripple.style.top = `${event.clientY - rect.top}px`;
      element.style.position = 'relative';
      element.style.overflow = 'hidden';
      element.append(ripple);
      setTimeout(() => ripple.remove(), 650);
    });
  });
  const slides = [...document.querySelectorAll('.testimonial')];
  let slide = 0;
  const showSlide = index => {
    slide = (index + slides.length) % slides.length;
    slides.forEach((item, i) => item.classList.toggle('is-active', i === slide));
  };
  document.querySelector('[data-testimonial-prev]')?.addEventListener('click', () => showSlide(slide - 1));
  document.querySelector('[data-testimonial-next]')?.addEventListener('click', () => showSlide(slide + 1));
  if (slides.length > 1 && !reduced) setInterval(() => showSlide(slide + 1), 5500);
})();
