// Configuration and File Database
const files = [
  '00_Table_of_Contents.md',
  'Part_01_NFT_Fundamentals_ISO25010.md',
  'Part_02_Performance_Testing_Load_Stress.md',
  'Part_03_Performance_Testing_Spike_Soak_Scalability.md',
  'Part_04_Security_Testing_Fundamentals_OWASP.md',
  'Part_05_Security_Testing_PenTesting_DevSecOps.md',
  'Part_06_Usability_Interaction_Testing.md',
  'Part_07_Accessibility_Testing.md',
  'Part_08_Compatibility_Testing.md',
  'Part_09_Reliability_Availability_Recovery_Testing.md',
  'Part_10_Maintainability_Portability_Testing.md',
  'Part_11_Compliance_Privacy_Localization_Testing.md',
  'Part_12_NFT_Test_Planning_Strategy.md',
  'Part_13_NFT_CICD_Chaos_Modern_Trends.md'
];

const fileTitles = {
  '00_Table_of_Contents.md': 'Table of Contents',
  'Part_01_NFT_Fundamentals_ISO25010.md': 'Part 1: NFT Fundamentals & ISO 25010',
  'Part_02_Performance_Testing_Load_Stress.md': 'Part 2: Performance Testing I — Load & Stress',
  'Part_03_Performance_Testing_Spike_Soak_Scalability.md': 'Part 3: Performance Testing II — Spike, Soak & Scalability',
  'Part_04_Security_Testing_Fundamentals_OWASP.md': 'Part 4: Security Testing I — OWASP & Fundamentals',
  'Part_05_Security_Testing_PenTesting_DevSecOps.md': 'Part 5: Security Testing II — Pen Testing & DevSecOps',
  'Part_06_Usability_Interaction_Testing.md': 'Part 6: Usability & Interaction Testing',
  'Part_07_Accessibility_Testing.md': 'Part 7: Accessibility Testing',
  'Part_08_Compatibility_Testing.md': 'Part 8: Compatibility Testing',
  'Part_09_Reliability_Availability_Recovery_Testing.md': 'Part 9: Reliability, Availability & Recovery',
  'Part_10_Maintainability_Portability_Testing.md': 'Part 10: Maintainability & Portability',
  'Part_11_Compliance_Privacy_Localization_Testing.md': 'Part 11: Compliance, Privacy & Localization',
  'Part_12_NFT_Test_Planning_Strategy.md': 'Part 12: NFT Test Planning & Strategy',
  'Part_13_NFT_CICD_Chaos_Modern_Trends.md': 'Part 13: NFT in CI/CD, Chaos & Modern Trends'
};

const studyParts = files.filter(f => f !== '00_Table_of_Contents.md');

// State Variables
let currentFile = '00_Table_of_Contents.md';
let fileCache = {};
let searchIndex = []; // Flat array of sections for search indexing
let isPreloaded = false;

// DOM Elements
const sidebar = document.getElementById('sidebar');
const sidebarOverlay = document.getElementById('sidebar-overlay');
const menuToggle = document.getElementById('menu-toggle');
const sidebarClose = document.getElementById('sidebar-close');
const themeToggle = document.getElementById('theme-toggle');
const breadcrumbs = document.getElementById('breadcrumbs');
const currentBreadcrumb = document.getElementById('current-breadcrumb');
const skeleton = document.getElementById('skeleton');
const contentEl = document.getElementById('content');
const contentNav = document.getElementById('content-nav');
const prevPartBtn = document.getElementById('prev-part');
const nextPartBtn = document.getElementById('next-part');
const prevPartTitle = document.getElementById('prev-part-title');
const nextPartTitle = document.getElementById('next-part-title');
const backToTopBtn = document.getElementById('back-to-top-btn');
const scrollProgressBar = document.getElementById('scroll-progress-bar');
const markReadToggle = document.getElementById('mark-read-toggle');
const overallProgressBar = document.getElementById('overall-progress-bar');
const overallProgressText = document.getElementById('overall-progress-text');

// Search Elements
const quickSearchInput = document.getElementById('quick-search');
const searchClearBtn = document.getElementById('search-clear');
const searchModal = document.getElementById('search-modal');
const searchModalClose = document.getElementById('search-modal-close');
const modalSearchInput = document.getElementById('modal-search-input');
const searchIndexStatus = document.getElementById('search-index-status');
const searchResultsContainer = document.getElementById('search-results');

// Initial Setup & Event Listeners
document.addEventListener('DOMContentLoaded', () => {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  initTheme();
  initRouting();
  initSidebar();
  initSearch();
  initProgress();
  initScrollEvents();
  initPrint();
});

// 1. THEME MANAGEMENT
function initTheme() {
  themeToggle.addEventListener('click', () => {
    const isDark = document.documentElement.classList.toggle('dark');
    const themeSetting = isDark ? 'dark' : 'light';
    localStorage.setItem('testing-guide-theme', themeSetting);
    document.documentElement.setAttribute('data-theme-setting', themeSetting);
    
    // Re-render Mermaid charts to reflect the new theme
    if (contentEl.style.display !== 'none') {
      renderMermaid();
    }
  });

  // Listen to system changes
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    if (localStorage.getItem('testing-guide-theme') === 'system') {
      document.documentElement.classList.toggle('dark', e.matches);
      if (contentEl.style.display !== 'none') {
        renderMermaid();
      }
    }
  });
}

// 2. ROUTING (Hash-based)
function initRouting() {
  window.addEventListener('hashchange', handleRoute);
  handleRoute();
}

function handleRoute() {
  const hash = window.location.hash; // e.g. #Part_01_Software_Testing_Fundamentals.md#11-what-is-testing
  
  if (!hash || hash === '#') {
    loadPage('00_Table_of_Contents.md');
    return;
  }
  
  // Parse filename and target scroll heading ID
  const rawRoute = hash.substring(1);
  const routeParts = rawRoute.split('#');
  const filename = routeParts[0];
  const targetSection = routeParts[1] || null;
  
  if (files.includes(filename)) {
    loadPage(filename, targetSection);
  } else {
    // If not a valid file, fallback to Table of Contents
    loadPage('00_Table_of_Contents.md');
  }
}

// 3. MARKDOWN RENDERING PIPELINE
const renderer = new marked.Renderer();

// Custom slugify to match standard heading ID conversions
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // remove non-alphanumeric except dashes/spaces
    .replace(/[\s_]+/g, '-')  // replace spaces/underscores with dashes
    .replace(/-+/g, '-')      // remove multiple dashes
    .replace(/^-+|-+$/g, ''); // strip leading/trailing dashes
}

// Custom heading generator to enforce precise slugify ID naming
renderer.heading = function(text, level) {
  const cleanText = text.replace(/<[^>]*>/g, ''); // strip HTML tags
  const id = slugify(cleanText);
  return `<h${level} id="${id}">${text}</h${level}>`;
};

// Custom code block renderer (intercepts Mermaid and styles regular code with Prism)
renderer.code = function(code, language) {
  if (language === 'mermaid') {
    return `<div class="mermaid">${code}</div>`;
  }
  
  const validLang = !!(language && Prism.languages[language]);
  const highlighted = validLang ? Prism.highlight(code, Prism.languages[language], language) : escapeHtml(code);
  const langClass = validLang ? `language-${language}` : '';
  
  return `<pre class="${langClass}"><code class="${langClass}">${highlighted}</code></pre>`;
};

// External links (any absolute http(s) URL — always a different repo/site) open in a new tab;
// internal/relative links (in-app hash routes, anchors) stay in the same tab.
renderer.link = function(href, title, text) {
  const titleAttr = title ? ` title="${title}"` : '';
  const isExternal = /^https?:\/\//i.test(href || '');
  const targetAttrs = isExternal ? ' target="_blank" rel="noopener noreferrer"' : '';
  return `<a href="${href}"${titleAttr}${targetAttrs}>${text}</a>`;
};

marked.use({ renderer });

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Post-render processors
function processAlerts(html) {
  const alertTypes = {
    'NOTE': { class: 'alert-note', icon: 'info', label: 'Note' },
    'TIP': { class: 'alert-tip', icon: 'lightbulb', label: 'Tip' },
    'IMPORTANT': { class: 'alert-important', icon: 'exclamation-circle', label: 'Important' },
    'WARNING': { class: 'alert-warning', icon: 'exclamation-triangle', label: 'Warning' },
    'CAUTION': { class: 'alert-caution', icon: 'fire', label: 'Caution' }
  };
  
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const blockquotes = tempDiv.querySelectorAll('blockquote');
  
  blockquotes.forEach(bq => {
    const text = bq.innerHTML.trim();
    // Regex matches GitHub syntax alerts e.g. <p>[!NOTE]<br> or <p>[!NOTE]
    const match = text.match(/^<p>\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\]\s*(?:<br\s*\/?>)?\s*/i);
    
    if (match) {
      const type = match[1].toUpperCase();
      const alertInfo = alertTypes[type];
      let content = text.substring(match[0].length);
      
      // Repair tags in case of split
      if (!content.startsWith('<p>') && !content.startsWith('</p>')) {
        content = '<p>' + content;
      }
      
      const alertDiv = document.createElement('div');
      alertDiv.className = `alert-box ${alertInfo.class}`;
      
      const titleDiv = document.createElement('div');
      titleDiv.className = 'alert-title';
      titleDiv.innerHTML = `${getIconSvg(alertInfo.icon)} <span>${alertInfo.label}</span>`;
      
      const bodyDiv = document.createElement('div');
      bodyDiv.className = 'alert-body';
      bodyDiv.innerHTML = content;
      
      alertDiv.appendChild(titleDiv);
      alertDiv.appendChild(bodyDiv);
      bq.parentNode.replaceChild(alertDiv, bq);
    }
  });
  
  return tempDiv.innerHTML;
}

function getIconSvg(iconName) {
  const svgs = {
    info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>`,
    lightbulb: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5"></path><line x1="9" y1="18" x2="15" y2="18"></line><line x1="10" y1="22" x2="14" y2="22"></line></svg>`,
    'exclamation-circle': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`,
    'exclamation-triangle': `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>`,
    fire: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"></path></svg>`
  };
  return svgs[iconName] || '';
}

function wrapTables(html) {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;
  const tables = tempDiv.querySelectorAll('table');
  tables.forEach(table => {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';
    table.parentNode.insertBefore(wrapper, table);
    wrapper.appendChild(table);
  });
  return tempDiv.innerHTML;
}

// Render Mermaid flowcharts natively
async function renderMermaid() {
  const mermaidDivs = document.querySelectorAll('#content .mermaid');
  if (mermaidDivs.length === 0) return;
  
  try {
    const isDark = document.documentElement.classList.contains('dark');
    // Clear and reset mermaid to apply dark/light styling correctly
    mermaid.initialize({
      startOnLoad: false,
      theme: isDark ? 'dark' : 'default',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true, htmlLabels: true }
    });
    
    await mermaid.run({
      querySelector: '#content .mermaid'
    });
  } catch (error) {
    console.error('Failed to render Mermaid:', error);
  }
}

// 4. MAIN PAGE LOADING ACTION
async function loadPage(filename, targetSection = null) {
  currentFile = filename;
  
  // Show skeleton loader
  skeleton.style.display = 'flex';
  contentEl.style.display = 'none';
  contentNav.style.display = 'none';
  
  // Update sidebar active link states
  document.querySelectorAll('.nav-link').forEach(link => {
    const linkFile = link.getAttribute('data-file');
    link.classList.toggle('active', linkFile === filename);
  });
  
  // Update Header breadcrumbs
  if (filename === '00_Table_of_Contents.md') {
    currentBreadcrumb.textContent = 'Table of Contents';
    markReadToggle.style.display = 'none';
  } else {
    currentBreadcrumb.textContent = fileTitles[filename] || 'Study Guide';
    markReadToggle.style.display = 'flex';
    updateMarkReadToggleState();
  }
  
  let markdownText = '';
  
  // Fetch file from cache or repository root
  if (fileCache[filename]) {
    markdownText = fileCache[filename];
  } else {
    try {
      const response = await fetch(filename);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      markdownText = await response.text();
      fileCache[filename] = markdownText; // cache it
    } catch (error) {
      console.error(`Error loading page ${filename}:`, error);
      contentEl.innerHTML = `<div class="error-state">
        <h2>⚠️ Failed to load file</h2>
        <p>Could not fetch the document <code>${filename}</code>. Make sure the file exists and is hosted correctly.</p>
        <button onclick="loadPage('${filename}')" class="btn">Retry</button>
      </div>`;
      skeleton.style.display = 'none';
      contentEl.style.display = 'block';
      return;
    }
  }

  // Intercept and rewrite markdown links to handle hash-based client-side routing
  // E.g. [Link](Part_02_Types_of_Testing.md) -> [Link](#Part_02_Types_of_Testing.md)
  // Also handles [Link](Part_02_Types_of_Testing.md#target) -> [Link](#Part_02_Types_of_Testing.md#target)
  let cleanMarkdown = markdownText;
  
  // Parse and render
  let html = marked.parse(cleanMarkdown);
  html = processAlerts(html);
  html = wrapTables(html);
  
  contentEl.innerHTML = html;
  
  // Show content first so elements have layout and sizes in the DOM
  skeleton.style.display = 'none';
  contentEl.style.display = 'block';
  contentNav.style.display = 'flex';
  
  // Setup bottom navigation buttons
  setupBottomNav(filename);
  
  // Reset scroll immediately to ensure new page starts at the top
  window.scrollTo({ top: 0 });
  
  // Sync scroll positioning after short layout paint delay
  if (targetSection) {
    setTimeout(() => {
      const el = document.getElementById(targetSection);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }, 80);
  }
  
  // Trigger Mermaid graphics rendering once browser layout reflow is complete
  setTimeout(async () => {
    await renderMermaid();
    // Re-verify and snap scroll position after Mermaid elements complete rendering and change height
    if (targetSection) {
      const el = document.getElementById(targetSection);
      if (el) {
        el.scrollIntoView({ behavior: 'auto' });
      }
    } else {
      window.scrollTo({ top: 0 });
    }
  }, 150);
  
  // Trigger background indexing of all remaining files (lazy preload)
  if (!isPreloaded) {
    lazyPreloadAndIndex();
  }
}

// Intercept page links inside content to keep router internal
document.addEventListener('click', e => {
  const link = e.target.closest('a');
  if (link) {
    const href = link.getAttribute('href');
    if (href && !href.startsWith('http')) {
      // Clean leading hash to check if it's a page route (e.g. '#Part_01_Software_Testing_Fundamentals.md' or 'Part_01_Software_Testing_Fundamentals.md')
      const cleanHref = href.startsWith('#') ? href.substring(1) : href;
      const mdMatch = cleanHref.match(/^([^#]+\.md)(#.*)?$/);
      
      if (mdMatch) {
        e.preventDefault();
        const file = mdMatch[1];
        const headingHash = mdMatch[2] || '';
        const targetHash = `#${file}${headingHash}`;
        
        if (window.location.hash === targetHash) {
          // If hash is already the same, hashchange won't fire. Manually load page to trigger scroll/render resets.
          loadPage(file, headingHash ? headingHash.substring(1) : null);
        } else {
          window.location.hash = targetHash;
        }
        
        // Hide mobile sidebar on link clicks
        if (sidebar.classList.contains('active')) {
          sidebar.classList.remove('active');
          sidebarOverlay.style.display = 'none';
        }
      } else if (href.startsWith('#') && href.length > 1) {
        // Internal page scroll links (anchors inside the current page)
        e.preventDefault();
        const targetId = href.substring(1);
        const el = document.getElementById(targetId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
          // Update address bar hash without triggering route
          history.pushState(null, null, `#${currentFile}#${targetId}`);
        }
      }
    }
  }
});

// Setup bottom Navigation
function setupBottomNav(filename) {
  const currentIndex = files.indexOf(filename);
  
  // Prev button
  if (currentIndex > 0) {
    const prevFile = files[currentIndex - 1];
    prevPartBtn.style.visibility = 'visible';
    prevPartBtn.href = `#${prevFile}`;
    prevPartTitle.textContent = fileTitles[prevFile];
  } else {
    prevPartBtn.style.visibility = 'hidden';
  }
  
  // Next button
  if (currentIndex < files.length - 1) {
    const nextFile = files[currentIndex + 1];
    nextPartBtn.style.visibility = 'visible';
    nextPartBtn.href = `#${nextFile}`;
    nextPartTitle.textContent = fileTitles[nextFile];
  } else {
    nextPartBtn.style.visibility = 'hidden';
  }
}

// 5. SIDEBAR MANAGEMENT
function initSidebar() {
  menuToggle.addEventListener('click', () => {
    if (window.innerWidth > 1024) {
      sidebar.classList.toggle('collapsed');
      localStorage.setItem('testing-guide-sidebar-collapsed', sidebar.classList.contains('collapsed'));
    } else {
      sidebar.classList.add('active');
      sidebarOverlay.style.display = 'block';
    }
  });

  const closeSidebar = () => {
    if (window.innerWidth > 1024) {
      sidebar.classList.add('collapsed');
      localStorage.setItem('testing-guide-sidebar-collapsed', 'true');
    } else {
      sidebar.classList.remove('active');
      sidebarOverlay.style.display = 'none';
    }
  };

  sidebarClose.addEventListener('click', closeSidebar);
  sidebarOverlay.addEventListener('click', closeSidebar);
  
  // Sidebar navigation click routing (only hides sidebar on mobile after click)
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    link.addEventListener('click', () => {
      if (window.innerWidth <= 1024) {
        closeSidebar();
      }
    });
  });

  // Restore desktop sidebar collapse state on load
  if (window.innerWidth > 1024) {
    const isCollapsed = localStorage.getItem('testing-guide-sidebar-collapsed') === 'true';
    sidebar.classList.toggle('collapsed', isCollapsed);
  }
}

// 6. SCROLL PROGRESS & BACK TO TOP BUTTON
function initScrollEvents() {
  window.addEventListener('scroll', () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    
    // Back to top visibility
    if (scrollTop > 300) {
      backToTopBtn.classList.add('visible');
    } else {
      backToTopBtn.classList.remove('visible');
    }
    
    // Scroll progress bar indicator
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    if (scrollHeight > 0) {
      const percentage = (scrollTop / scrollHeight) * 100;
      scrollProgressBar.style.width = `${percentage}%`;
    } else {
      scrollProgressBar.style.width = '0%';
    }
  });

  backToTopBtn.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// 7. STUDY READING PROGRESS
function initProgress() {
  updateOverallProgress();
  
  markReadToggle.addEventListener('click', () => {
    if (currentFile === '00_Table_of_Contents.md') return;
    
    let readFiles = getReadFiles();
    const index = readFiles.indexOf(currentFile);
    
    if (index === -1) {
      readFiles.push(currentFile);
    } else {
      readFiles.splice(index, 1);
    }
    
    localStorage.setItem('testing-guide-read-status', JSON.stringify(readFiles));
    
    updateMarkReadToggleState();
    updateOverallProgress();
  });
}

function getReadFiles() {
  const read = localStorage.getItem('testing-guide-read-status');
  return read ? JSON.parse(read) : [];
}

function updateMarkReadToggleState() {
  const readFiles = getReadFiles();
  const isRead = readFiles.includes(currentFile);
  const btnText = markReadToggle.querySelector('.btn-text');
  
  markReadToggle.classList.toggle('is-read', isRead);
  
  if (isRead) {
    btnText.textContent = 'Completed';
  } else {
    btnText.textContent = 'Mark as Read';
  }
}

function updateOverallProgress() {
  const readFiles = getReadFiles();
  
  // Highlight completed checkmarks in sidebar
  document.querySelectorAll('.sidebar-nav .nav-link').forEach(link => {
    const file = link.getAttribute('data-file');
    const isRead = readFiles.includes(file);
    link.classList.toggle('is-read', isRead);
  });
  
  // Calculate stats
  const totalParts = studyParts.length;
  const completedCount = studyParts.filter(f => readFiles.includes(f)).length;
  const percent = totalParts > 0 ? Math.round((completedCount / totalParts) * 100) : 0;
  
  overallProgressBar.style.width = `${percent}%`;
  overallProgressText.textContent = `${completedCount} / ${totalParts} Parts Read (${percent}%)`;
}

// 8. BACKGROUND FILE PRELOADING & FULL-TEXT INDEXING
async function lazyPreloadAndIndex() {
  isPreloaded = true; // prevent duplicate loops
  
  // Fetch files sequentially in the background after short timeout to let initial paint render
  setTimeout(async () => {
    for (const file of files) {
      if (!fileCache[file]) {
        try {
          const res = await fetch(file);
          if (res.ok) {
            const text = await res.ok ? await res.text() : '';
            fileCache[file] = text;
            indexMarkdownFile(file, text);
          }
        } catch (e) {
          console.warn(`Preloading failed for ${file}:`, e);
        }
      } else {
        indexMarkdownFile(file, fileCache[file]);
      }
    }
    
    // Hide search indexing label once done
    searchIndexStatus.style.display = 'none';
  }, 1000);
}

// Index a file by breaking it down into searchable sections based on headings
function indexMarkdownFile(filename, markdown) {
  const lines = markdown.split('\n');
  let currentHeading = 'Introduction';
  let currentSlug = '';
  let currentTextLines = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Match headers like ## 2.1 Software Testing...
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    
    if (headingMatch) {
      // Save the previous section
      if (currentTextLines.length > 0) {
        searchIndex.push({
          file: filename,
          partTitle: fileTitles[filename] || filename,
          heading: currentHeading,
          slug: currentSlug,
          text: currentTextLines.join(' ')
        });
        currentTextLines = [];
      }
      
      currentHeading = headingMatch[2];
      currentSlug = slugify(currentHeading);
    } else if (line.length > 0 && !line.startsWith('!') && !line.startsWith('[') && !line.startsWith('|')) {
      // Index only readable text strings, filter out markdown images/links/tables to clean matching
      currentTextLines.push(line);
    }
  }
  
  // Push last block
  if (currentTextLines.length > 0) {
    searchIndex.push({
      file: filename,
      partTitle: fileTitles[filename] || filename,
      heading: currentHeading,
      slug: currentSlug,
      text: currentTextLines.join(' ')
    });
  }
}

// 9. FULL-TEXT SEARCH SYSTEM
function initSearch() {
  // Sidebar search input acts as trigger to open modal search
  quickSearchInput.addEventListener('focus', () => {
    openSearchModal();
  });
  
  quickSearchInput.addEventListener('click', () => {
    openSearchModal();
  });

  // Modal interactions
  searchModalClose.addEventListener('click', closeSearchModal);
  searchModal.addEventListener('click', (e) => {
    if (e.target === searchModal) {
      closeSearchModal();
    }
  });

  // "/" key to open search, ESC key to close
  window.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== quickSearchInput && document.activeElement !== modalSearchInput) {
      e.preventDefault();
      openSearchModal();
    } else if (e.key === 'Escape') {
      closeSearchModal();
    }
  });

  // Search input typing handler
  modalSearchInput.addEventListener('input', () => {
    performSearch(modalSearchInput.value);
  });
}

function openSearchModal() {
  searchModal.classList.add('active');
  modalSearchInput.value = quickSearchInput.value;
  modalSearchInput.focus();
  performSearch(modalSearchInput.value);
  
  // Sync background status indicator in case index loads slowly
  searchIndexStatus.style.display = searchIndex.length === 0 ? 'flex' : 'none';
}

function closeSearchModal() {
  searchModal.classList.remove('active');
  quickSearchInput.value = '';
  modalSearchInput.value = '';
}

function performSearch(query) {
  query = query.trim();
  
  if (query.length < 2) {
    searchResultsContainer.innerHTML = `<div class="search-empty-state">
      <p>Type keywords to search the entire study guide</p>
      <div class="search-tips">
        <strong>Tips:</strong>
        <ul>
          <li>Press <kbd>Enter</kbd> to search</li>
          <li>Search for specific templates (e.g. <code>RTM</code>, <code>IEEE 829</code>, <code>Bug Report</code>)</li>
          <li>Search for interview questions by typing <code>Interview</code></li>
        </ul>
      </div>
    </div>`;
    return;
  }

  // Scoring system:
  // Heading match: 10 points
  // Text match: 2 points
  const results = [];
  const searchRegex = new RegExp(escapeRegex(query), 'gi');

  searchIndex.forEach(section => {
    let score = 0;
    const headingMatchCount = (section.heading.match(searchRegex) || []).length;
    const textMatchCount = (section.text.match(searchRegex) || []).length;

    if (headingMatchCount > 0) score += headingMatchCount * 10;
    if (textMatchCount > 0) score += textMatchCount * 2;

    if (score > 0) {
      results.push({
        section,
        score,
        matchIndex: section.text.toLowerCase().indexOf(query.toLowerCase())
      });
    }
  });

  // Sort by score (descending)
  results.sort((a, b) => b.score - a.score);

  if (results.length === 0) {
    searchResultsContainer.innerHTML = `<div class="search-empty-state">
      <p>No results found for "${escapeHtml(query)}"</p>
      <span style="font-size: 0.875rem;">Try refining your query terms or searching for acronyms (e.g., STLC, UAT, RTM).</span>
    </div>`;
    return;
  }

  // Render top 25 results
  const listEl = document.createElement('div');
  listEl.className = 'search-results-list';
  
  results.slice(0, 25).forEach(res => {
    const s = res.section;
    const item = document.createElement('div');
    item.className = 'search-result-item';
    
    // Build snippet
    let snippet = '';
    const matchPos = res.matchIndex;
    
    if (matchPos !== -1) {
      const start = Math.max(0, matchPos - 60);
      const end = Math.min(s.text.length, matchPos + query.length + 80);
      snippet = s.text.slice(start, end);
      
      if (start > 0) snippet = '...' + snippet;
      if (end < s.text.length) snippet = snippet + '...';
    } else {
      snippet = s.text.slice(0, 140) + '...';
    }
    
    // Highlight matching tokens
    const highlightedHeading = s.heading.replace(searchRegex, (m) => `<mark>${escapeHtml(m)}</mark>`);
    const highlightedSnippet = escapeHtml(snippet).replace(searchRegex, (m) => `<mark>${m}</mark>`);
    
    item.innerHTML = `
      <div class="result-location">${escapeHtml(s.partTitle)}</div>
      <div class="result-heading">${highlightedHeading}</div>
      <div class="result-text">${highlightedSnippet}</div>
    `;
    
    item.addEventListener('click', () => {
      closeSearchModal();
      // Route hash
      window.location.hash = `#${s.file}${s.slug ? '#' + s.slug : ''}`;
    });
    
    listEl.appendChild(item);
  });
  
  searchResultsContainer.innerHTML = '';
  searchResultsContainer.appendChild(listEl);
}

function escapeRegex(string) {
  return string.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

// 10. CLIENT-SIDE FULL PDF COMPILATION & PRINTING
function initPrint() {
  const printBtn = document.getElementById('print-full-guide');
  const printOverlay = document.getElementById('print-loading-overlay');
  const printProgressBar = document.getElementById('print-compilation-progress-bar');
  const printProgressText = document.getElementById('print-compilation-progress-text');
  const printContainer = document.getElementById('print-container');

  if (!printBtn) return;

  printBtn.addEventListener('click', async () => {
    // Show compiling overlay
    printOverlay.classList.add('active');
    printProgressBar.style.width = '0%';
    printProgressText.textContent = 'Initializing compilation...';
    printContainer.innerHTML = '';

    try {
      let compiledHtml = '';
      
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const title = fileTitles[file] || 'Table of Contents';
        
        // Update progress bar & label
        const percent = Math.round((i / files.length) * 100);
        printProgressBar.style.width = `${percent}%`;
        printProgressText.textContent = `Fetching & compiling ${i + 1}/${files.length}: ${title}`;
        
        let markdownText = '';
        // Pull from cache or fetch asynchronously
        if (fileCache[file]) {
          markdownText = fileCache[file];
        } else {
          const res = await fetch(file);
          if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
          markdownText = await res.text();
          fileCache[file] = markdownText;
        }

        // Render Markdown content to HTML
        let html = marked.parse(markdownText);
        html = processAlerts(html);
        html = wrapTables(html);

        // Append content section with print page breaks
        const breakClass = i < files.length - 1 ? 'print-page-break' : '';
        compiledHtml += `<section class="${breakClass} markdown-body" data-file="${file}">
          ${html}
        </section>`;
      }

      printProgressBar.style.width = '100%';
      printProgressText.textContent = 'Rendering diagrams and final layout...';
      
      printContainer.innerHTML = compiledHtml;

      // Render Mermaid diagrams in print container with clean light theme
      await renderMermaidForPrint();

      // Delay to allow DOM layout reflow and font loads to finalize
      setTimeout(() => {
        // Hide loader overlay and fire system print dialog
        printOverlay.classList.remove('active');
        window.print();
      }, 600);

    } catch (error) {
      console.error('Failed to compile print document:', error);
      printProgressText.textContent = '❌ Error compiling document. Please try again.';
      setTimeout(() => {
        printOverlay.classList.remove('active');
      }, 3000);
    }
  });

  // Clean up print container to clear memory usage after print triggers
  window.addEventListener('afterprint', () => {
    printContainer.innerHTML = '';
  });
}

async function renderMermaidForPrint() {
  const mermaidDivs = document.querySelectorAll('#print-container .mermaid');
  if (mermaidDivs.length === 0) return;

  try {
    // Force default light theme in mermaid for high-contrast paper print compatibility
    mermaid.initialize({
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: { useMaxWidth: true, htmlLabels: true }
    });

    await mermaid.run({
      querySelector: '#print-container .mermaid'
    });
  } catch (error) {
    console.error('Failed to render print Mermaid:', error);
  }
}
