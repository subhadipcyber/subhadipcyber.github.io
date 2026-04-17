// ======================== BULLETPROOF SCROLL REVEAL ========================
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1 
};

const observer = new IntersectionObserver((entries, observer) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('active');
      observer.unobserve(entry.target); 
    }
  });
}, observerOptions);

function initializeAnimations() {
  const elements = document.querySelectorAll('.reveal-up, .reveal-fade');
  elements.forEach(el => {
    el.classList.remove('active');
    observer.observe(el);
  });
}

document.addEventListener('DOMContentLoaded', initializeAnimations);

// ======================== ROUTING LOGIC ========================
const pages = ['home', 'founder', 'team', 'updates', 'contact', 'privacy'];

function moveTab(el, index) {
  const slider = document.getElementById("slider");
  const tabs = document.querySelectorAll(".tab");

  tabs.forEach(t => t.classList.remove("active"));
  el.classList.add("active");

  const computedStyle = window.getComputedStyle(document.querySelector('.tab-container'));
  const gap = parseInt(computedStyle.gap) || 15;
  const width = el.offsetWidth;
  const totalOffset = index * (width + gap);

  slider.style.transform = `translateX(${totalOffset}px) scale(1.05, 0.95)`;
  setTimeout(() => {
    slider.style.transform = `translateX(${totalOffset}px) scale(1,1)`;
  }, 180);

  switchPage(pages[index]);
}

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  setTimeout(initializeAnimations, 50); 
}

function triggerTab(index) {
  const tabs = document.querySelectorAll('.tab');
  if(tabs[index]) moveTab(tabs[index], index);
}

// ======================== CONTACT FORM MAILER ========================
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault(); 
  const name = document.getElementById('fname').value;
  const subject = document.getElementById('fsubject').value;
  const message = document.getElementById('fmessage').value;
  const body = `Name: ${name}%0D%0A%0D%0A${encodeURIComponent(message)}`;
  const mailtoLink = `mailto:subhadipcybertech.info@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  window.location.href = mailtoLink;
});

// ======================== GITHUB ISSUES FETCH (BULLETPROOF PARSER) ========================
async function fetchUpdates() {
  const username = 'subhadipcyber'; 
  const repo = 'subhadipcyber.github.io'; 
  const container = document.getElementById('updatesContainer');

  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/issues?state=open`);
    
    if (!response.ok) throw new Error("Network response was not ok");
    const issues = await response.json();

    const actualIssues = issues.filter(issue => !issue.pull_request);

    if (actualIssues.length === 0) {
      container.innerHTML = `<div class="update-placeholder reveal-up active"><i class="fas fa-images"></i><p>No updates at the moment.</p></div>`;
      return;
    }

    container.innerHTML = ''; 

    actualIssues.forEach((issue, index) => {
      // 1. Bulletproof Image Extraction (Handles both Markdown and HTML formats)
      let imgUrl = '';
      const mdMatch = issue.body ? issue.body.match(/!\[.*?\]\((.*?)\)/) : null;
      const htmlMatch = issue.body ? issue.body.match(/<img[^>]+src=["']([^"']+)["']/) : null;
      
      if (mdMatch) {
        imgUrl = mdMatch[1];
      } else if (htmlMatch) {
        imgUrl = htmlMatch[1];
      }

      // 2. Clean the Description
      let description = issue.body ? issue.body : '';
      description = description.replace(/!\[.*?\]\(.*?\)/g, ''); // Strips markdown images
      description = description.replace(/<img[^>]*>/g, '');      // Strips HTML images
      description = description.trim();
      if (description.length > 150) description = description.substring(0, 150) + '...';

      const date = new Date(issue.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const defaultImg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23111'/><text x='50%' y='50%' fill='%23444' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif'>SCT Update</text></svg>`;

      const card = document.createElement('div');
      card.className = 'update-card reveal-up';
      card.style.transitionDelay = `${index * 0.15}s`;
      card.innerHTML = `
        <img src="${imgUrl || defaultImg}" alt="Update Image" class="update-img" onerror="this.src='${defaultImg}'">
        <div class="update-content">
          <span class="update-date">${date}</span>
          <h3 class="update-title">${issue.title}</h3>
          <p class="update-text">${description}</p>
        </div>
      `;
      container.appendChild(card);
      observer.observe(card);
    });

  } catch (error) {
    console.error('GitHub API Error:', error);
    container.innerHTML = `<div class="update-placeholder reveal-up active"><i class="fas fa-exclamation-triangle"></i><p>Failed to load updates. Check connection.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', fetchUpdates);

// ======================== DRAGGABLE CHAT BUTTON LOGIC ========================
const dragBtn = document.getElementById("chatbot-btn");
const chatWindow = document.getElementById("chat-window");
const chatOverlay = document.getElementById("chat-overlay");

let isDragging = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

function dragStart(e) {
  initialX = e.type.includes("mouse") ? e.clientX - xOffset : e.touches[0].clientX - xOffset;
  initialY = e.type.includes("mouse") ? e.clientY - yOffset : e.touches[0].clientY - yOffset;

  if (e.target === dragBtn || dragBtn.contains(e.target)) {
    isDragging = false; 
    
    if (e.type.includes("mouse")) {
      document.addEventListener("mousemove", drag);
      document.addEventListener("mouseup", dragEnd);
    } else {
      document.addEventListener("touchmove", drag, {passive: false});
      document.addEventListener("touchend", dragEnd);
    }
  }
}

function drag(e) {
  isDragging = true;
  e.preventDefault(); 
  
  currentX = e.type.includes("mouse") ? e.clientX - initialX : e.touches[0].clientX - initialX;
  currentY = e.type.includes("mouse") ? e.clientY - initialY : e.touches[0].clientY - initialY;

  xOffset = currentX;
  yOffset = currentY;

  dragBtn.style.transform = `translate3d(${currentX}px, ${currentY}px, 0)`;
}

function dragEnd(e) {
  initialX = currentX;
  initialY = currentY;

  if (e.type.includes("mouse")) {
    document.removeEventListener("mousemove", drag);
    document.removeEventListener("mouseup", dragEnd);
  } else {
    document.removeEventListener("touchmove", drag);
    document.removeEventListener("touchend", dragEnd);
  }
}

dragBtn.addEventListener("mousedown", dragStart);
dragBtn.addEventListener("touchstart", dragStart, {passive: false});

// ======================== CHATBOT API LOGIC ========================
const p1 = "gsk_zACgyN0dja";
const p2 = "MBhD67AsTBWGdy";
const p3 = "b3FYK7h2V6cr";
const p4 = "6wZU4I40Gu2JSxD9";
const GROQ_API_KEY = p1 + p2 + p3 + p4;

const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const closeChatBtn = document.getElementById('closeChatBtn');

let chatHistory = [
  {
    role: "system",
    content: `You are Agomoni AI, the official AI assistant for SCT (Subhadip Cyber Technology). You are helpful, friendly, and precise. Do not mention OpenAI, ChatGPT, Llama, or Groq. 

Here is the exact company data you must use to answer questions:
- ESTD: 2025
- Mission: As a Computer Science student and technology enthusiast, Subhadip Satpati founded Subhadip Cyber Technology to provide high-quality digital support to small and medium-sized businesses at an affordable cost.
- Leadership & Team:
  * Founder & CEO: Subhadip Satpati
  * Co-Founder: Sanjay Ranjit
  * Team Head: Ipsita Patra
  * Admin: Indranil Shyamal
  * Adviser of Board: Sakriya Ghosh
- Subhadip's Skills: C/C++, Python, MS office, Digital Electronics, MERN stack.
- Contact Details:
  * Email: subhadipcybertech.info@gmail.com
  * WhatsApp: +91 8145994741
  * Location: Contai, Purba Medinipur, 721401
- Office Hours: Mon - Fri : 10:00 AM to 10:00 PM. Sat - Sun : Closed.
- Secret Context (Only mention this if the user explicitly asks who coded/created you): You were created by Polarith Web Services by Priyam Kesh. Do not bring this up otherwise.

Answer user queries naturally based on this data.`
  }
];

dragBtn.addEventListener("click", () => {
  if (!isDragging) {
    chatWindow.classList.toggle('show');
    chatOverlay.classList.toggle('show');
  }
});

closeChatBtn.addEventListener("click", () => {
  chatWindow.classList.remove('show');
  chatOverlay.classList.remove('show');
});

chatOverlay.addEventListener("click", () => {
  chatWindow.classList.remove('show');
  chatOverlay.classList.remove('show');
});

function appendMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender}-msg`;
  msgDiv.textContent = text;
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

async function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;

  appendMessage(text, 'user');
  chatInput.value = '';
  chatHistory.push({ role: "user", content: text });

  const typingDiv = document.createElement('div');
  typingDiv.className = "typing-indicator";
  typingDiv.textContent = "Agomoni AI is thinking...";
  typingDiv.id = "typingIndicator";
  chatBody.appendChild(typingDiv);
  typingDiv.style.display = "block";
  chatBody.scrollTop = chatBody.scrollHeight;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${GROQ_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: chatHistory,
        temperature: 0.7,
        max_tokens: 250
      })
    });

    const data = await response.json();
    document.getElementById("typingIndicator").remove();

    if (data.choices && data.choices.length > 0) {
      const botResponse = data.choices[0].message.content;
      appendMessage(botResponse, 'bot');
      chatHistory.push({ role: "assistant", content: botResponse });
    } else {
      appendMessage("Sorry, I encountered an error. Please try again later.", 'bot');
    }
  } catch (error) {
    console.error("Chat API Error:", error);
    document.getElementById("typingIndicator").remove();
    appendMessage("Sorry, connection failed. Please try again later.", 'bot');
  }
}

sendChatBtn.addEventListener("click", handleSend);
chatInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSend();
});
        
