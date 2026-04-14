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

// ======================== GITHUB ISSUES FETCH (UPDATES) ========================
async function fetchUpdates() {
  // Hardcoded based on URL to fix the load error shown in screenshot
  const username = 'subhadipcyber'; 
  const repo = 'subhadipcyber.github.io'; 
  const container = document.getElementById('updatesContainer');

  try {
    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/issues?state=open`);
    
    if (!response.ok) throw new Error("Network response was not ok");
    const issues = await response.json();

    const actualIssues = issues.filter(issue => !issue.pull_request);

    if (actualIssues.length === 0) {
      container.innerHTML = `<div class="update-placeholder"><i class="fas fa-images"></i><p>No updates at the moment.</p></div>`;
      return;
    }

    container.innerHTML = ''; 

    actualIssues.forEach(issue => {
      const imgMatch = issue.body ? issue.body.match(/!\[.*?\]\((.*?)\)/) : null;
      const imgUrl = imgMatch ? imgMatch[1] : '';

      let description = issue.body ? issue.body.replace(/!\[.*?\]\(.*?\)/g, '').trim() : '';
      if (description.length > 150) description = description.substring(0, 150) + '...';

      const date = new Date(issue.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const defaultImg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23111'/><text x='50%' y='50%' fill='%23444' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif'>SCT Update</text></svg>`;

      const card = document.createElement('div');
      card.className = 'update-card';
      card.innerHTML = `
        <img src="${imgUrl || defaultImg}" alt="Update Image" class="update-img" onerror="this.src='${defaultImg}'">
        <div class="update-content">
          <span class="update-date">${date}</span>
          <h3 class="update-title">${issue.title}</h3>
          <p class="update-text">${description}</p>
        </div>
      `;
      container.appendChild(card);
    });
  } catch (error) {
    console.error('GitHub API Error:', error);
    container.innerHTML = `<div class="update-placeholder"><i class="fas fa-exclamation-triangle"></i><p>Failed to load updates. Check connection.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', fetchUpdates);

// ======================== DRAGGABLE BUTTON LOGIC ========================
const dragBtn = document.getElementById("chatbot-btn");
const chatWindow = document.getElementById("chat-window");

let isDragging = false;
let currentX, currentY, initialX, initialY;
let xOffset = 0, yOffset = 0;

function dragStart(e) {
  initialX = e.type.includes("mouse") ? e.clientX - xOffset : e.touches[0].clientX - xOffset;
  initialY = e.type.includes("mouse") ? e.clientY - yOffset : e.touches[0].clientY - yOffset;

  if (e.target === dragBtn || dragBtn.contains(e.target)) {
    isDragging = false; // Reset drag state on click/touch start
    
    // Add event listeners for moving
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
  e.preventDefault(); // Prevent scrolling while dragging on mobile
  
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

// ======================== CHATBOT LOGIC & API ========================
const p1 = "gsk_zACgyN0dja";
const p2 = "MBhD67AsTBWGdy";
const p3 = "b3FYK7h2V6cr";
const p4 = "6wZU4I40Gu2JSxD9";
const GROQ_API_KEY = p1 + p2 + p3 + p4;

const chatBody = document.getElementById('chatBody');
const chatInput = document.getElementById('chatInput');
const sendChatBtn = document.getElementById('sendChatBtn');
const closeChatBtn = document.getElementById('closeChatBtn');

// System Instructions Context
let chatHistory = [
  {
    role: "system",
    content: `You are Agomoni AI. You are a helpful, precise, and concise chatbot. 
    You are based on the PriAxom AI Architecture. Do not mention OpenAI, ChatGPT, Llama, or Groq. 
    You represent SCT (Subhadip Cyber Tech) Creative Studio.
    Here is the data you know about the site and founder:
    - Founder: Subhadip Satpati
    - Founder Details: Student at MC(A) - cs. Based in Contai :: Purba Medinipur. Current City: Midnapore, West Bengal.
    - SCT Services: Website Development, Playstore App Development, Video Editing, Graphics Designing.
    - Team: Ipsita Patra (Team Head), Indranil Shyamal (Admin), Sakriya Ghosh (Advisor Of Board).
    - Contact Email: subhadipcybertech.info@gmail.com
    - Contact Phone: +91 81459 94741
    Answer user queries based on this data naturally.`
  }
];

// Open/Close Chat Window (prevent open if dragging occurred)
dragBtn.addEventListener("click", () => {
  if (!isDragging) chatWindow.classList.toggle('show');
});

closeChatBtn.addEventListener("click", () => {
  chatWindow.classList.remove('show');
});

// Add message to UI
function appendMessage(text, sender) {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg ${sender}-msg`;
  msgDiv.textContent = text;
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Handle sending message
async function handleSend() {
  const text = chatInput.value.trim();
  if (!text) return;

  // Add User Message
  appendMessage(text, 'user');
  chatInput.value = '';
  chatHistory.push({ role: "user", content: text });

  // Show typing indicator
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
