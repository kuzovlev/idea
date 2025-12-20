const burger = document.querySelector('.burger');
const navWrapper = document.querySelector('.nav-wrapper');

burger.addEventListener('click', () => {
  const isOpen = navWrapper.classList.toggle('is-open');
  burger.setAttribute('aria-expanded', isOpen);
});
