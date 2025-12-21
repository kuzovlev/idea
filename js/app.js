const burger = document.querySelector('.burger');
const mobileNav = document.querySelector('.mobile-nav');

burger.addEventListener('click', () => {
  const open = mobileNav.classList.toggle('is-open');
  document.body.classList.toggle('nav-open', open);
  burger.setAttribute('aria-expanded', open);
});
