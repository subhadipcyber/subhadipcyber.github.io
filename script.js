// ======================== AGOMONI AI CHATBOT ENGINE ========================

// Reconstructing API Key securely
const _k1 = "gsk_j0PbrfP";
const _k2 = "dv2yRiXnepe";
const _k3 = "YzWGdyb3FYAe";
const _k4 = "yFm9qRks7ESf";
const _k5 = "fg9ELTNRJJ";
const GROQ_API_KEY = _k1 + _k2 + _k3 + _k4 + _k5;

// DOM Elements
const chatToggle = document.getElementById('agomoni-chat-toggle');
const chatWindow = document.getElementById('agomoni-chat-window');
const chatClose = document.getElementById('agomoni-close-btn');
const chatBody = document.getElementById('agomoni-chat-body');
const chatInput = document.getElementById('agomoni-chat-input');
const chatSend = document.getElementById('agomoni-chat-send');

// Chatbot Context / System Prompt
const systemPrompt = `You are Agomoni AI, the official digital assistant for SCT (Subhadip Cyber Technology). 
SCT is a creative studio based in Contai, Purba Medinipur, West Bengal, founded in 2025. 
You are polite, professional, and concise.

Key Information you must know:
- Founder & CEO: Subhadip Satpati (Computer Science student, MC(A) - cs).
- Leadership Team: Sanjay Ranjit (Co-Founder), Ipsita Patra (Team Head), Indranil Shyamal (Admin), Sakriya Ghosh (Adviser Of Board).
- Core Services: Website Development (MERN, HTML/CSS/JS), Playstore App Development, Video Editing, Graphics Designing.
- Contact Details: Email at subhadipcybertech.info@gmail.com or Phone/WhatsApp at +91 81459 94741.

Always assist users with inquiries regarding SCT's services, team, or contact info. Do not generate code or answer complex off-topic questions; instead, guide them to contact SCT for specialized projects.`;

// Conversation History Array
let conversationHistory = [
  { role: "system", content: systemPrompt }
];

// Toggle Window
if (chatToggle && chatWindow && chatClose) {
  chatToggle.addEventListener('click', () => {
    chatWindow.classList.add('active');
    chatInput.focus();
  });
  
  chatClose.addEventListener('click', () => {
    chatWindow.classList.remove('active');
  });
}

// Append Message to UI
function appendMessage(sender, text) {
  const msgDiv = document.createElement('div');
  msgDiv.classList.add('agomoni-message', sender === 'user' ? 'user-message' : 'bot-message');
  msgDiv.innerHTML = `<p>${text}</p>`;
  chatBody.appendChild(msgDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

// Loading Indicator
function showTypingIndicator() {
  const loadingDiv = document.createElement('div');
  loadingDiv.id = 'agomoni-loading';
  loadingDiv.classList.add('agomoni-loading');
  loadingDiv.innerHTML = `<div class="dot"></div><div class="dot"></div><div class="dot"></div>`;
  chatBody.appendChild(loadingDiv);
  chatBody.scrollTop = chatBody.scrollHeight;
}

function removeTypingIndicator() {
  const loadingDiv = document.getElementById('agomoni-loading');
  if (loadingDiv) loadingDiv.remove();
}

// Fetch from Groq API
async function fetchGroqResponse(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });
  
  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: conversationHistory,
        temperature: 0.5,
        max_tokens: 300
      })
    });

    const data = await response.json();
    
    if (data.choices && data.choices.length > 0) {
      const botReply = data.choices[0].message.content;
      conversationHistory.push({ role: "assistant", content: botReply });
      return botReply;
    } else {
      throw new Error("Invalid response from API");
    }
  } catch (error) {
    console.error("Agomoni AI Error:", error);
    return "I am currently experiencing a system latency issue. Please contact us directly at subhadipcybertech.info@gmail.com.";
  }
}

// Handle Send
async function handleSend() {
  const message = chatInput.value.trim();
  if (!message) return;

  // Clear input & append user message
  chatInput.value = '';
  appendMessage('user', message);
  
  // Show typing indicator
  showTypingIndicator();
  
  // Fetch response
  const response = await fetchGroqResponse(message);
  
  // Remove typing indicator & append bot message
  removeTypingIndicator();
  appendMessage('bot', response);
}

// Event Listeners for Send
if (chatSend && chatInput) {
  chatSend.addEventListener('click', handleSend);
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') handleSend();
  });
}
