// Mobile nav toggle
function toggleMenu() {
  var menu = document.getElementById('mobile-menu');
  var btn = document.querySelector('.menu-toggle');
  if (!menu || !btn) return;
  menu.classList.toggle('is-open');
  btn.classList.toggle('is-open');
}

function closeMenu() {
  var menu = document.getElementById('mobile-menu');
  var btn = document.querySelector('.menu-toggle');
  if (!menu || !btn) return;
  menu.classList.remove('is-open');
  btn.classList.remove('is-open');
}

// Accordion (project pages)
function toggleAccordion(trigger) {
  var item = trigger.closest('.accordion-item');
  var panel = item.querySelector('.accordion-panel');
  var isOpen = item.classList.contains('is-open');

  if (isOpen) {
    item.classList.remove('is-open');
    panel.style.maxHeight = '0px';
  } else {
    item.classList.add('is-open');
    panel.style.maxHeight = panel.scrollHeight + 'px';
  }
}
