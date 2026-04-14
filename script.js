// script.js
const pages = ['home', 'founder', 'team', 'updates', 'contact', 'privacy'];

function moveTab(el, index) {
  const slider = document.getElementById("slider");
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(t => t.classList.remove("active"));
  el.classList.add("active");

  const computedStyle = window.getComputedStyle(document.querySelector('.tab-container'));
  const gap = parseInt(computedStyle.gap) || 10;
  const width = el.offsetWidth;

  // Liquid bounce animation
  slider.style.transform = `translateX(${index * (width + gap)}px) scale(1.05, 0.95)`;
  setTimeout(() => {
    slider.style.transform = `translateX(${index * (width + gap)}px) scale(1,1)`;
  }, 180);

  // Switch actual page content
  switchPage(pages[index]);
}

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Trigger tab from internal links (like Hero buttons)
function triggerTab(index) {
  const tabs = document.querySelectorAll('.tab');
  if(tabs[index]) {
    moveTab(tabs[index], index);
  }
}

// Form handling via User's Email App
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault();
  
  const name = document.getElementById('fname').value;
  const subject = document.getElementById('fsubject').value;
  const message = document.getElementById('fmessage').value;
  
  const body = `Name: ${name}%0D%0A%0D%0A${encodeURIComponent(message)}`;
  const mailtoLink = `mailto:subhadipcybertech.info@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  
  window.location.href = mailtoLink;
});
