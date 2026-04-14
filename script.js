// script.js

// Array of page IDs mapped to the order of the bottom navigation tabs
const pages = ['home', 'founder', 'team', 'updates', 'contact', 'privacy'];

// ======================== LIQUID GLASS TABS LOGIC ========================
function moveTab(el, index) {
  const slider = document.getElementById("slider");
  const tabs = document.querySelectorAll(".tab");

  // Update active states
  tabs.forEach(t => t.classList.remove("active"));
  el.classList.add("active");

  // Calculate translation distance based on layout
  const computedStyle = window.getComputedStyle(document.querySelector('.tab-container'));
  const gap = parseInt(computedStyle.gap) || 15;
  const width = el.offsetWidth;
  const totalOffset = index * (width + gap);

  // Apply spring/liquid deformation effect
  slider.style.transform = `translateX(${totalOffset}px) scale(1.05, 0.95)`;
  
  // Snap back to original scale after deformation
  setTimeout(() => {
    slider.style.transform = `translateX(${totalOffset}px) scale(1,1)`;
  }, 180);

  // Change the active view
  switchPage(pages[index]);
}

// Function to switch visible page containers
function switchPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.getElementById(pageId).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Function to trigger tab changes from inside the content (e.g. Hero buttons)
function triggerTab(index) {
  const tabs = document.querySelectorAll('.tab');
  if(tabs[index]) {
    moveTab(tabs[index], index);
  }
}

// ======================== CONTACT FORM MAILER ========================
document.getElementById('contactForm').addEventListener('submit', function(e) {
  e.preventDefault(); // Prevent standard page reload
  
  const name = document.getElementById('fname').value;
  const subject = document.getElementById('fsubject').value;
  const message = document.getElementById('fmessage').value;
  
  // Construct email body
  const body = `Name: ${name}%0D%0A%0D%0A${encodeURIComponent(message)}`;
  
  // Create mailto link pointing to the specified address
  const mailtoLink = `mailto:subhadipcybertech.info@gmail.com?subject=${encodeURIComponent(subject)}&body=${body}`;
  
  // Open the user's default email client
  window.location.href = mailtoLink;
});

// ======================== GITHUB ISSUES FETCH (UPDATES) ========================
async function fetchUpdates() {
  /* ==========================================
     IMPORTANT: CHANGE THESE TWO VARIABLES!
     Put your GitHub Username and Repo name here.
     ========================================== */
  const username = 'YOUR_GITHUB_USERNAME'; 
  const repo = 'YOUR_REPO_NAME'; 
  
  const container = document.getElementById('updatesContainer');

  try {
    // Fetch open issues from the public repository
    const response = await fetch(`https://api.github.com/repos/${username}/${repo}/issues?state=open`);
    const issues = await response.json();

    // Filter out pull requests (GitHub API returns PRs as issues)
    const actualIssues = issues.filter(issue => !issue.pull_request);

    // Handle empty state
    if (actualIssues.length === 0) {
      container.innerHTML = `<div class="update-placeholder"><i class="fas fa-images"></i><p>No updates at the moment.</p></div>`;
      return;
    }

    container.innerHTML = ''; // Clear placeholder loading text

    // Build the UI for each issue
    actualIssues.forEach(issue => {
      // 1. Extract Image URL from markdown syntax: ![alt text](https://image.url)
      const imgMatch = issue.body ? issue.body.match(/!\[.*?\]\((.*?)\)/) : null;
      const imgUrl = imgMatch ? imgMatch[1] : '';

      // 2. Extract Text (Remove image markdown, limit length)
      let description = issue.body ? issue.body.replace(/!\[.*?\]\(.*?\)/g, '').trim() : '';
      if (description.length > 150) description = description.substring(0, 150) + '...';

      // 3. Format Date nicely
      const date = new Date(issue.created_at).toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });

      // 4. Fallback SVG if no image is found in the issue
      const defaultImg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23111'/><text x='50%' y='50%' fill='%23444' dominant-baseline='middle' text-anchor='middle' font-family='sans-serif'>SCT Update</text></svg>`;

      // 5. Create DOM Element
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

// Execute the fetch logic once the DOM is fully loaded
document.addEventListener('DOMContentLoaded', fetchUpdates);
          
