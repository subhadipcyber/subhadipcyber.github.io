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

// ======================== ROUTING LOGIC & HASH NAVIGATION ========================
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

  // Clear hash if we are moving back to main site from admin
  if(window.location.hash === '#/admin') {
      window.history.pushState("", document.title, window.location.pathname + window.location.search);
      handleHashRouting();
  }

  switchPage(pages[index]);
}

function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById(pageId);
  if(targetPage) targetPage.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
  
  setTimeout(initializeAnimations, 50); 
}

function triggerTab(index) {
  const tabs = document.querySelectorAll('.tab');
  if(tabs[index]) moveTab(tabs[index], index);
}

// Top Nav Blog Button
document.getElementById('blogNavBtn').addEventListener('click', () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  switchPage('blog');
});

// Secure Portal Hash Routing & Authentication
function handleHashRouting() {
  const hash = window.location.hash;
  if (hash === '#/admin') {
     document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
     document.getElementById('admin').classList.add('active');
     
     // Hide global UI elements
     document.querySelector('nav').style.display = 'none';
     document.getElementById('bottomNav').style.display = 'none';
     document.getElementById('chatbot-btn').style.display = 'none';
     const chatWin = document.getElementById('chat-window');
     if(chatWin) chatWin.classList.remove('show');
     const chatOver = document.getElementById('chat-overlay');
     if(chatOver) chatOver.classList.remove('show');

     // Reset Login State
     document.getElementById('adminLogin').style.display = 'block';
     document.getElementById('adminDashboard').style.display = 'none';
     document.getElementById('loginError').style.display = 'none';
     document.getElementById('adminPassword').value = '';
  } else {
     // Restore global UI elements
     const nav = document.querySelector('nav');
     if(nav) nav.style.display = 'flex';
     const bNav = document.getElementById('bottomNav');
     if(bNav) bNav.style.display = 'flex';
     const chatBtn = document.getElementById('chatbot-btn');
     if(chatBtn) chatBtn.style.display = 'flex';
     
     if (document.getElementById('admin') && document.getElementById('admin').classList.contains('active')) {
         triggerTab(0); // Go home safely
     }
  }
}
window.addEventListener('hashchange', handleHashRouting);
document.addEventListener('DOMContentLoaded', handleHashRouting);

// Admin Login Logic
const adminLoginBtn = document.getElementById('adminLoginBtn');
if(adminLoginBtn) {
  adminLoginBtn.addEventListener('click', () => {
    const pass = document.getElementById('adminPassword').value;
    const error = document.getElementById('loginError');
    if(pass === 'polarithwebsct') {
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminDashboard').style.display = 'block';
      error.style.display = 'none';
      document.getElementById('adminPassword').value = '';
    } else {
      error.style.display = 'block';
    }
  });
}

const adminPassInput = document.getElementById('adminPassword');
if(adminPassInput) {
  adminPassInput.addEventListener('keypress', (e) => {
    if(e.key === 'Enter') adminLoginBtn.click();
  });
}


// ======================== FIREBASE CLOUD FIRESTORE: CONTACT FORM ========================
document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault(); 
  const name = document.getElementById('fname').value;
  const subject = document.getElementById('fsubject').value;
  const message = document.getElementById('fmessage').value;
  const submitBtn = document.getElementById('submitBtn');
  
  if(!window.firebaseDB) return alert("Database connection initializing, please wait a moment.");

  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending securely...';
  submitBtn.disabled = true;

  try {
    await window.firebaseAPI.addDoc(window.firebaseAPI.collection(window.firebaseDB, "contacts"), {
      name: name,
      subject: subject,
      message: message,
      timestamp: window.firebaseAPI.serverTimestamp()
    });
    
    submitBtn.textContent = 'Message Received!';
    submitBtn.style.background = '#3ef0e0';
    submitBtn.style.color = '#000';
    document.getElementById('contactForm').reset();
    
    setTimeout(() => { 
      submitBtn.textContent = originalText; 
      submitBtn.style.background = '';
      submitBtn.style.color = '';
      submitBtn.disabled = false;
    }, 4000);
  } catch (error) {
    console.error("Firebase Error:", error);
    submitBtn.textContent = 'Failed. Try again.';
    submitBtn.style.background = '#ff4d4d';
    setTimeout(() => { 
      submitBtn.textContent = originalText; 
      submitBtn.style.background = '';
      submitBtn.disabled = false;
    }, 4000);
  }
});


// ======================== FIREBASE: DYNAMIC BLOG RENDERING ========================
async function fetchBlogs() {
  if (!window.firebaseDB) {
     setTimeout(fetchBlogs, 100);
     return;
  }

  const container = document.getElementById('blogContainer');
  try {
    const q = window.firebaseAPI.query(
      window.firebaseAPI.collection(window.firebaseDB, "blogs"), 
      window.firebaseAPI.orderBy("timestamp", "desc")
    );
    const querySnapshot = await window.firebaseAPI.getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = `<div class="update-placeholder reveal-up active"><i class="fas fa-feather-alt"></i><p>No blog posts published yet.</p></div>`;
      return;
    }

    container.innerHTML = ''; 

    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
      const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      let imagesHtml = '';
      if (data.images && data.images.length > 0) {
        imagesHtml = `<div class="blog-thumbnails">` + 
          data.images.map(url => `<img src="${url}" class="blog-thumb" onclick="openImageModal('${url}')" alt="Blog Image">`).join('') + 
          `</div>`;
      }

      const card = document.createElement('div');
      card.className = 'blog-card reveal-up';
      card.style.transitionDelay = `${(index % 5) * 0.15}s`; 
      card.innerHTML = `
        <div class="blog-header">
          <h3 class="blog-title">${data.title}</h3>
          <span class="blog-date">${dateStr}</span>
        </div>
        ${imagesHtml}
        <div class="blog-content">${data.content}</div>
      `;
      container.appendChild(card);
      observer.observe(card);
    });
  } catch (error) {
    console.error('Blog Fetch Error:', error);
    container.innerHTML = `<div class="update-placeholder reveal-up active"><i class="fas fa-exclamation-triangle"></i><p>Failed to load blog posts. Check database rules.</p></div>`;
  }
}

document.addEventListener('DOMContentLoaded', fetchBlogs);


// ======================== FIREBASE: ADMIN PORTAL UPLOADER ========================
let selectedImages = [];
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('imagePreviewContainer');

// Drag & Drop Listeners
if(dropZone && imageInput) {
  dropZone.addEventListener('click', () => imageInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
  });
  imageInput.addEventListener('change', (e) => handleFiles(e.target.files));
}

function handleFiles(files) {
  Array.from(files).forEach(file => {
    if(selectedImages.length >= 2) return alert('Maximum 2 images allowed per post.');
    if(file.type.startsWith('image/')) {
      selectedImages.push(file);
      renderPreviews();
    }
  });
}

function renderPreviews() {
  previewContainer.innerHTML = '';
  selectedImages.forEach((file, index) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const div = document.createElement('div');
      div.className = 'thumbnail-preview';
      div.innerHTML = `
        <img src="${e.target.result}">
        <button class="remove-btn" onclick="removeSelectedImage(${index})"><i class="fas fa-times"></i></button>
      `;
      previewContainer.appendChild(div);
    };
    reader.readAsDataURL(file);
  });
}

window.removeSelectedImage = function(index) {
  selectedImages.splice(index, 1);
  renderPreviews();
};

const publishBtn = document.getElementById('publishBlogBtn');
if(publishBtn) {
  publishBtn.addEventListener('click', async function() {
    if(!window.firebaseDB || !window.firebaseStorage) return alert("Firebase not initialized yet.");
    
    const title = document.getElementById('blogTitle').value.trim();
    const content = document.getElementById('richTextEditor').innerHTML.trim();
    const status = document.getElementById('publishStatus');

    if(!title || !content || content === '<br>') return alert('Title and content are required.');

    this.textContent = 'Publishing...';
    this.disabled = true;
    status.textContent = 'Uploading images to Cloud Storage...';
    status.style.color = 'var(--gold)';

    try {
      const imageUrls = [];
      // 1. Upload Images securely to Storage
      for (let file of selectedImages) {
        const uniqueName = Date.now() + '-' + file.name.replace(/\s+/g, '-');
        const storageRef = window.firebaseAPI.ref(window.firebaseStorage, 'blog_images/' + uniqueName);
        await window.firebaseAPI.uploadBytes(storageRef, file);
        const url = await window.firebaseAPI.getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      status.textContent = 'Saving post to Firestore...';

      // 2. Write Post Data to Firestore
      await window.firebaseAPI.addDoc(window.firebaseAPI.collection(window.firebaseDB, "blogs"), {
        title: title,
        content: content,
        images: imageUrls,
        timestamp: window.firebaseAPI.serverTimestamp()
      });

      status.textContent = 'Post published successfully!';
      status.style.color = 'var(--cyan)';

      // 3. Reset UI & Refresh Feed
      document.getElementById('blogTitle').value = '';
      document.getElementById('richTextEditor').innerHTML = '';
      selectedImages = [];
      renderPreviews();
      fetchBlogs(); 

    } catch (error) {
      console.error("Publishing Error: ", error);
      status.textContent = 'Error publishing post. Ensure database rules allow writing.';
      status.style.color = '#ff4d4d';
    } finally {
      this.textContent = 'Publish Post';
      this.disabled = false;
      setTimeout(() => status.textContent = '', 5000);
    }
  });
}

// ======================== IMAGE ZOOM MODAL ========================
const imageModal = document.getElementById('imageModal');
window.openImageModal = function(src) {
  document.getElementById('modalImg').src = src;
  imageModal.style.display = 'flex';
};
if(imageModal) {
  imageModal.addEventListener('click', () => {
    imageModal.style.display = 'none';
  });
}


// ======================== GITHUB ISSUES FETCH (UPDATES FEED) ========================
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
      let imgUrl = '';
      const mdMatch = issue.body ? issue.body.match(/!\[.*?\]\((.*?)\)/) : null;
      const htmlMatch = issue.body ? issue.body.match(/<img[^>]+src=["']([^"']+)["']/) : null;
      
      if (mdMatch) imgUrl = mdMatch[1];
      else if (htmlMatch) imgUrl = htmlMatch[1];

      let description = issue.body ? issue.body : '';
      description = description.replace(/!\[.*?\]\(.*?\)/g, '').replace(/<img[^>]*>/g, '').trim();
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

if(dragBtn) {
    dragBtn.addEventListener("mousedown", dragStart);
    dragBtn.addEventListener("touchstart", dragStart, {passive: false});
}

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

if(dragBtn) {
    dragBtn.addEventListener("click", () => {
      if (!isDragging) {
        chatWindow.classList.toggle('show');
        chatOverlay.classList.toggle('show');
      }
    });
}

if(closeChatBtn) {
    closeChatBtn.addEventListener("click", () => {
      chatWindow.classList.remove('show');
      chatOverlay.classList.remove('show');
    });
}

if(chatOverlay) {
    chatOverlay.addEventListener("click", () => {
      chatWindow.classList.remove('show');
      chatOverlay.classList.remove('show');
    });
}

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
    if(document.getElementById("typingIndicator")) document.getElementById("typingIndicator").remove();
    appendMessage("Sorry, connection failed. Please try again later.", 'bot');
  }
}

if(sendChatBtn) sendChatBtn.addEventListener("click", handleSend);
if(chatInput) {
    chatInput.addEventListener("keypress", (e) => {
      if (e.key === "Enter") handleSend();
    });
}
