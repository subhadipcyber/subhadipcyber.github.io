// ======================== SCROLL REVEAL OBSERVER ========================
const observerOptions = { root: null, rootMargin: '0px', threshold: 0.1 };
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
  elements.forEach(el => { el.classList.remove('active'); observer.observe(el); });
}
document.addEventListener('DOMContentLoaded', initializeAnimations);

// ======================== SPA ROUTING ENGINE ========================
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
  setTimeout(() => { slider.style.transform = `translateX(${totalOffset}px) scale(1,1)`; }, 180);

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

document.getElementById('blogNavBtn').addEventListener('click', () => {
  document.querySelectorAll(".tab").forEach(t => t.classList.remove("active"));
  switchPage('blog');
});

// ======================== RESTRICTED PORTAL HASH ROUTING ========================
function handleHashRouting() {
  const hash = window.location.hash;
  if (hash === '#/admin') {
     document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
     document.getElementById('admin').classList.add('active');
     document.querySelector('nav').style.display = 'none';
     document.getElementById('bottomNav').style.display = 'none';
     document.getElementById('adminLogin').style.display = 'block';
     document.getElementById('adminDashboard').style.display = 'none';
     document.getElementById('loginError').style.display = 'none';
     document.getElementById('adminPassword').value = '';
  } else {
     const nav = document.querySelector('nav'); if(nav) nav.style.display = 'flex';
     const bNav = document.getElementById('bottomNav'); if(bNav) bNav.style.display = 'flex';
     if (document.getElementById('admin') && document.getElementById('admin').classList.contains('active')) {
         triggerTab(0); 
     }
  }
}
window.addEventListener('hashchange', handleHashRouting);
document.addEventListener('DOMContentLoaded', handleHashRouting);

const adminLoginBtn = document.getElementById('adminLoginBtn');
if(adminLoginBtn) {
  adminLoginBtn.addEventListener('click', () => {
    const pass = document.getElementById('adminPassword').value;
    const error = document.getElementById('loginError');
    if(pass === 'polarithwebsct') {
      document.getElementById('adminLogin').style.display = 'none';
      document.getElementById('adminDashboard').style.display = 'block';
      error.style.display = 'none';
      renderAdminPostsList(); 
    } else {
      error.style.display = 'block';
    }
  });
}
const adminPassInput = document.getElementById('adminPassword');
if(adminPassInput) adminPassInput.addEventListener('keypress', (e) => { if(e.key === 'Enter') adminLoginBtn.click(); });


// ======================== FIREBASE CLOUD FIRESTORE: CONTACTS ========================
document.getElementById('contactForm').addEventListener('submit', async function(e) {
  e.preventDefault(); 
  if(!window.firebaseDB) return alert("Database loading...");
  const submitBtn = document.getElementById('submitBtn');
  const originalText = submitBtn.textContent;
  submitBtn.textContent = 'Sending...'; submitBtn.disabled = true;

  try {
    await window.firebaseAPI.addDoc(window.firebaseAPI.collection(window.firebaseDB, "contacts"), {
      name: document.getElementById('fname').value,
      subject: document.getElementById('fsubject').value,
      message: document.getElementById('fmessage').value,
      timestamp: window.firebaseAPI.serverTimestamp()
    });
    submitBtn.textContent = 'Message Received!'; submitBtn.style.background = '#3ef0e0'; submitBtn.style.color = '#000';
    document.getElementById('contactForm').reset();
  } catch (error) {
    submitBtn.textContent = 'Error. Try again.'; submitBtn.style.background = '#ff4d4d';
  } finally {
    setTimeout(() => { submitBtn.textContent = originalText; submitBtn.style.background = ''; submitBtn.style.color = ''; submitBtn.disabled = false; }, 4000);
  }
});


// ======================== RETRIEVAL & PUBLIC SPA TIME STREAM ========================
let blogCache = [];
let currentEditingDocId = null; 

async function fetchBlogs() {
  if (!window.firebaseDB) { setTimeout(fetchBlogs, 100); return; }
  const container = document.getElementById('blogContainer');

  try {
    const q = window.firebaseAPI.query(window.firebaseAPI.collection(window.firebaseDB, "blogs"), window.firebaseAPI.orderBy("timestamp", "desc"));
    const querySnapshot = await window.firebaseAPI.getDocs(q);

    if (querySnapshot.empty) {
      container.innerHTML = `<div class="update-placeholder reveal-up active"><i class="fas fa-feather-alt"></i><p>No blog posts published yet.</p></div>`;
      return;
    }

    container.innerHTML = ''; 
    blogCache = [];

    querySnapshot.forEach((doc, index) => {
      const data = doc.data();
      blogCache.push({ id: doc.id, ...data });

      const dateObj = data.timestamp ? data.timestamp.toDate() : new Date();
      const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

      // Build Excerpt: Filter out inline images for clean text preview
      let tempDiv = document.createElement('div');
      tempDiv.innerHTML = data.content;
      let rawText = tempDiv.textContent || tempDiv.innerText || "";
      let excerpt = rawText.length > 150 ? rawText.substring(0, 150) + "..." : rawText;

      let imagesHtml = '';
      if (data.images && data.images.length > 0) {
        imagesHtml = `<div class="blog-thumbnails">` + 
          data.images.map(url => `<img src="${url}" class="blog-thumb" onclick="event.stopPropagation(); openImageModal('${url}')" alt="Thumb">`).join('') + 
          `</div>`;
      }
      
      let cornerLinkHtml = '';
      if (data.linkUrl) {
          cornerLinkHtml = `<a href="${data.linkUrl}" target="_blank" class="blog-card-link-corner" onclick="event.stopPropagation();"><i class="fas fa-external-link-alt"></i> Link</a>`;
      }

      const card = document.createElement('div');
      card.className = 'blog-card reveal-up';
      card.style.transitionDelay = `${(index % 5) * 0.15}s`; 
      card.innerHTML = `
        ${cornerLinkHtml}
        <div class="blog-header" style="margin-bottom:0.5rem; padding-right:4rem;">
          <span class="blog-date" style="display:block; margin-bottom:5px;">${dateStr}</span>
          <h3 class="blog-title" style="font-size:1.6rem;">${data.title}</h3>
        </div>
        ${imagesHtml}
        <div class="blog-content">
          <p style="color: var(--muted); font-size:0.9rem; line-height:1.6;">${excerpt}</p>
          <button class="read-more-btn" onclick="viewSingleBlog('${doc.id}')">Read more...</button>
        </div>
      `;
      container.appendChild(card);
      observer.observe(card);
    });
  } catch (error) {
    console.error(error);
    container.innerHTML = `<div class="update-placeholder"><p>Failed to load posts.</p></div>`;
  }
}
document.addEventListener('DOMContentLoaded', fetchBlogs);

window.viewSingleBlog = function(id) {
  const post = blogCache.find(p => p.id === id);
  if(!post) return;

  const dateObj = post.timestamp ? post.timestamp.toDate() : new Date();
  const dateStr = dateObj.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

  let imagesHtml = '';
  if (post.images && post.images.length > 0) {
    imagesHtml = `<div class="blog-thumbnails" style="margin: 1.5rem 0;">` + 
      post.images.map(url => `<img src="${url}" class="blog-thumb" style="width:180px; height:120px;" onclick="openImageModal('${url}')" alt="Blog Image">`).join('') + 
      `</div>`;
  }

  let linkHtml = '';
  if (post.linkUrl) {
    linkHtml = `<a href="${post.linkUrl}" target="_blank" class="post-link-btn"><i class="fas fa-external-link-alt" style="margin-right:8px;"></i> Attached Link</a>`;
  }

  document.getElementById('singleBlogContainer').innerHTML = `
    <div class="blog-card" style="margin-top:0; box-shadow:none; border:none; background:transparent; padding:0;">
        <div class="blog-header">
          <span class="blog-date" style="display:block; margin-bottom:5px;">${dateStr}</span>
          <h1 class="blog-title" style="font-size:2.5rem; color:var(--text);">${post.title}</h1>
        </div>
        ${imagesHtml}
        <div class="blog-content" style="font-size:1.05rem; line-height:1.8; color:#9494a8;">${post.content}</div>
        ${linkHtml}
    </div>
  `;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const targetPage = document.getElementById('single-blog');
  if(targetPage) targetPage.classList.add('active');
  window.scrollTo({ top: 0, behavior: 'smooth' });
};


// ======================== ADMIN DASHBOARD PANEL TOGGLES ========================
const showCreateBtn = document.getElementById('adminShowCreateBtn');
const showManageBtn = document.getElementById('adminShowManageBtn');
const createFormWrapper = document.getElementById('adminCreateFormWrapper');
const manageListWrapper = document.getElementById('adminManageListWrapper');

if(showCreateBtn && showManageBtn) {
  showCreateBtn.addEventListener('click', () => {
    showCreateBtn.className = "btn-primary";
    showManageBtn.className = "btn-outline";
    createFormWrapper.style.display = "block";
    manageListWrapper.style.display = "none";
  });

  showManageBtn.addEventListener('click', () => {
    showManageBtn.className = "btn-primary";
    showCreateBtn.className = "btn-outline";
    createFormWrapper.style.display = "none";
    manageListWrapper.style.display = "block";
    renderAdminPostsList();
  });
}


// ======================== ADMIN CONSOLE: ROW RECORD GENERATION ========================
async function renderAdminPostsList() {
  if (!window.firebaseDB) return;
  const listContainer = document.getElementById('adminPostsListContainer');
  listContainer.innerHTML = '<p style="color:var(--muted); font-size:0.9rem;"><i class="fas fa-circle-notch fa-spin"></i> Fetching records from Firestore...</p>';

  try {
    const q = window.firebaseAPI.query(window.firebaseAPI.collection(window.firebaseDB, "blogs"), window.firebaseAPI.orderBy("timestamp", "desc"));
    const querySnapshot = await window.firebaseAPI.getDocs(q);

    if (querySnapshot.empty) {
      listContainer.innerHTML = '<p style="color:var(--muted); font-size:0.9rem;">No documents available inside database.</p>';
      return;
    }

    listContainer.innerHTML = '';

    querySnapshot.forEach(docSnap => {
      const post = docSnap.data();
      const id = docSnap.id;
      const dateObj = post.timestamp ? post.timestamp.toDate() : new Date();
      const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

      const row = document.createElement('div');
      row.className = 'managed-post-row';
      row.innerHTML = `
        <div class="managed-post-info">
          <span class="managed-post-title">${post.title}</span>
          <span class="managed-post-date">Uploaded: ${dateStr}</span>
        </div>
        <div class="managed-post-actions">
          <button class="action-edit-btn" onclick="initiatePostEdit('${id}')"><i class="fas fa-edit"></i> Edit</button>
          <button class="action-delete-btn" onclick="executePostDelete('${id}')"><i class="fas fa-trash-alt"></i> Delete</button>
        </div>
      `;
      listContainer.appendChild(row);
    });
  } catch (err) {
    console.error(err);
    listContainer.innerHTML = '<p style="color:#ff4d4d; font-size:0.9rem;">Failed to read management metrics.</p>';
  }
}


// ======================== MUTATION PIPELINES (EDIT AND DELETE) ========================
window.initiatePostEdit = function(id) {
  const targetPost = blogCache.find(p => p.id === id);
  if(!targetPost) return alert("Document out of sync. Please reload feed.");

  currentEditingDocId = id;

  document.getElementById('blogTitle').value = targetPost.title;
  document.getElementById('richTextEditor').innerHTML = targetPost.content;
  document.getElementById('blogLink').value = targetPost.linkUrl || '';
  computedBase64Images = targetPost.images || [];

  document.getElementById('adminFormModeTitle').textContent = "Modify / Edit Post Parameters";
  document.getElementById('adminFormModeTitle').style.color = "var(--cyan)";
  document.getElementById('publishBlogBtn').textContent = "Update Document";
  document.getElementById('cancelEditBtn').style.display = "inline-block";

  showCreateBtn.click();
  renderAdminPreviews();
};

window.executePostDelete = async function(id) {
  if(!confirm("Are you sure you want to permanently delete this post from Firestore? This action cannot be undone.")) return;
  
  try {
    const docRef = window.firebaseAPI.doc(window.firebaseDB, "blogs", id);
    await window.firebaseAPI.deleteDoc(docRef);
    alert("Post removed successfully.");
    renderAdminPostsList(); 
    fetchBlogs();           
  } catch(err) {
    console.error(err);
    alert("Permission denied or database timeout.");
  }
};

const cancelEditBtn = document.getElementById('cancelEditBtn');
if(cancelEditBtn) {
  cancelEditBtn.addEventListener('click', () => {
    resetAdminFormState();
    showManageBtn.click();
  });
}

function resetAdminFormState() {
  currentEditingDocId = null;
  document.getElementById('blogTitle').value = '';
  document.getElementById('richTextEditor').innerHTML = '';
  document.getElementById('blogLink').value = '';
  computedBase64Images = [];
  renderAdminPreviews();

  document.getElementById('adminFormModeTitle').textContent = "Publish a New Post";
  document.getElementById('adminFormModeTitle').style.color = "var(--gold)";
  document.getElementById('publishBlogBtn').textContent = "Publish Post";
  document.getElementById('cancelEditBtn').style.display = "none";
}


// ======================== ADMIN ENGINE: SECURE CLIENT CANVAS COMPRESSOR (THUMBNAILS) ========================
let computedBase64Images = [];
const dropZone = document.getElementById('dropZone');
const imageInput = document.getElementById('imageInput');
const previewContainer = document.getElementById('imagePreviewContainer');

if(dropZone && imageInput) {
  dropZone.addEventListener('click', () => imageInput.click());
  dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('dragover'));
  dropZone.addEventListener('drop', (e) => { e.preventDefault(); dropZone.classList.remove('dragover'); processImages(e.dataTransfer.files); });
  imageInput.addEventListener('change', (e) => processImages(e.target.files));
}

function processImages(files) {
  Array.from(files).forEach(file => {
    if(computedBase64Images.length >= 2) return alert('Max 2 images allowed.');
    if(!file.type.startsWith('image/')) return;

    const reader = new FileReader();
    reader.onload = function(event) {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const max_size = 700;

        if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } }
        else { if (height > max_size) { width *= max_size / height; height = max_size; } }

        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.6); 
        computedBase64Images.push(optimizedBase64);
        renderAdminPreviews();
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  });
}

function renderAdminPreviews() {
  previewContainer.innerHTML = '';
  computedBase64Images.forEach((base64, index) => {
    const div = document.createElement('div'); div.className = 'thumbnail-preview';
    div.innerHTML = `<img src="${base64}"><button class="remove-btn" onclick="removeAdminImage(${index})"><i class="fas fa-times"></i></button>`;
    previewContainer.appendChild(div);
  });
}
window.removeAdminImage = function(index) { computedBase64Images.splice(index, 1); renderAdminPreviews(); };

// ======================== ADMIN ENGINE: INLINE TEXT EDITOR IMAGES ========================
const inlineImageInput = document.getElementById('inlineImageInput');
if(inlineImageInput) {
    inlineImageInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = function(event) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                let width = img.width;
                let height = img.height;
                const max_size = 700; // Same compression size as thumbnails to preserve 1MB limits

                if (width > height) { if (width > max_size) { height *= max_size / width; width = max_size; } }
                else { if (height > max_size) { width *= max_size / height; height = max_size; } }

                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                const optimizedBase64 = canvas.toDataURL('image/jpeg', 0.6); 
                
                // Inject straight into active editor node
                const editor = document.getElementById('richTextEditor');
                editor.focus();
                document.execCommand('insertHTML', false, `<br><img src="${optimizedBase64}" alt="Inline Image"><br>`);
                
                inlineImageInput.value = ''; // Reset node payload
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });
}


// ======================== SUBMIT ENGINE (ADD / UPDATE) ========================
const publishBtn = document.getElementById('publishBlogBtn');
if(publishBtn) {
  publishBtn.addEventListener('click', async function() {
    if(!window.firebaseDB) return alert("Firestore database syncing...");
    const title = document.getElementById('blogTitle').value.trim();
    const content = document.getElementById('richTextEditor').innerHTML.trim();
    const linkUrl = document.getElementById('blogLink').value.trim();
    const status = document.getElementById('publishStatus');

    if(!title || !content || content === '<br>') return alert('Title and content are required.');

    this.disabled = true;
    status.style.color = 'var(--gold)';

    try {
      if (currentEditingDocId) {
        this.textContent = 'Updating Firestore Document...';
        status.textContent = 'Modifying document fields...';
        
        const docRef = window.firebaseAPI.doc(window.firebaseDB, "blogs", currentEditingDocId);
        await window.firebaseAPI.updateDoc(docRef, {
          title: title,
          content: content,
          images: computedBase64Images,
          linkUrl: linkUrl,
          lastUpdated: window.firebaseAPI.serverTimestamp()
        });
        
        status.textContent = 'Document successfully updated!';
        status.style.color = 'var(--cyan)';
        resetAdminFormState();
        showManageBtn.click(); 
      } else {
        this.textContent = 'Publishing to Firestore...';
        status.textContent = 'Writing new document...';

        await window.firebaseAPI.addDoc(window.firebaseAPI.collection(window.firebaseDB, "blogs"), {
          title: title,
          content: content,
          images: computedBase64Images,
          linkUrl: linkUrl,
          timestamp: window.firebaseAPI.serverTimestamp()
        });

        status.textContent = 'Post successfully published!';
        status.style.color = 'var(--cyan)';
        resetAdminFormState();
      }

      fetchBlogs(); 
    } catch (error) {
      console.error(error);
      status.textContent = 'Firestore write aborted. Verify your database security rules tab entries.';
      status.style.color = '#ff4d4d';
    } finally {
      this.disabled = false;
      this.textContent = currentEditingDocId ? "Update Document" : "Publish Post";
      setTimeout(() => status.textContent = '', 5000);
    }
  });
}

// ======================== MODALS & GRAPH UPDATES ========================
const imageModal = document.getElementById('imageModal');
window.openImageModal = function(src) { document.getElementById('modalImg').src = src; imageModal.style.display = 'flex'; };
if(imageModal) imageModal.addEventListener('click', () => imageModal.style.display = 'none');

async function fetchUpdates() {
  const container = document.getElementById('updatesContainer');
  try {
    const response = await fetch(`https://api.github.com/repos/subhadipcyber/subhadipcyber.github.io/issues?state=open`);
    if (!response.ok) return;
    const issues = await response.json();
    const actualIssues = issues.filter(issue => !issue.pull_request);
    
    if(actualIssues.length === 0) { 
      container.innerHTML = `<div class="update-placeholder"><p>No updates.</p></div>`; 
      return; 
    }
    
    container.innerHTML = '';
    
    actualIssues.forEach((issue, index) => {
      let imgUrl = '';
      
      const mdMatch = issue.body ? issue.body.match(/!\[.*?\]\((.*?)\)/) : null;
      const htmlMatch = issue.body ? issue.body.match(/<img[^>]+src=["']([^"']+)["']/) : null;
      
      if (mdMatch) imgUrl = mdMatch[1]; 
      else if (htmlMatch) imgUrl = htmlMatch[1];

      let desc = issue.body ? issue.body.replace(/!\[.*?\]\(.*?\)/g, '').replace(/<img[^>]*>/g, '').trim() : '';
      if (desc.length > 150) desc = desc.substring(0, 150) + '...';

      const date = new Date(issue.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
      const defaultImg = `data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100%' height='100%'><rect width='100%' height='100%' fill='%23111'/></svg>`;

      const card = document.createElement('div'); 
      card.className = 'update-card reveal-up';
      card.style.transitionDelay = `${(index % 5) * 0.15}s`;
      
      card.innerHTML = `
        <img src="${imgUrl || defaultImg}" class="update-img" onerror="this.src='${defaultImg}'">
        <div class="update-content">
          <span class="update-date">${date}</span>
          <h3 class="update-title">${issue.title}</h3>
          <p class="update-text">${desc}</p>
        </div>`;
        
      container.appendChild(card); 
      observer.observe(card);
    });
  } catch(e) {
      console.error(e);
      container.innerHTML = `<div class="update-placeholder"><p>Failed to load updates.</p></div>`;
  }
}
document.addEventListener('DOMContentLoaded', fetchUpdates);
