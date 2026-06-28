/* ============================================================
   BugLog — script.js
   Handles: nav hamburger, terminal typing, search/filter, copy buttons, AI verify
   ============================================================ */

// Global state variables for dashboard filtering and pagination (Module 5 & 6)
let activeFilter = 'all';
let searchQuery  = '';
let currentPage  = 1;

let filterTech = '';
let filterPriority = '';
let filterAiTool = '';
let filterStatus = '';
let filterStartDate = '';
let filterEndDate = '';

document.addEventListener('DOMContentLoaded', () => {

  /* ---- HAMBURGER NAV ---- */
  const hamburger = document.getElementById('hamburger');
  const mobileMenu = document.getElementById('mobileMenu');

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      mobileMenu.classList.toggle('open');
    });
    // Close on outside click
    document.addEventListener('click', (e) => {
      if (!hamburger.contains(e.target) && !mobileMenu.contains(e.target)) {
        mobileMenu.classList.remove('open');
      }
    });
  }


  /* ---- LANDING: TERMINAL TYPEWRITER ---- */
  const typedCmd = document.getElementById('typedCmd');
  const termOutput = document.getElementById('termOutput');
  if (typedCmd) {
    const cmd = 'buglog add --title "JWT not invalidated on logout"';
    let i = 0;
    const type = () => {
      if (i < cmd.length) {
        typedCmd.textContent += cmd[i++];
        setTimeout(type, 38 + Math.random() * 28);
      } else {
        // Show output after a beat
        setTimeout(() => {
          termOutput.style.display = 'block';
        }, 500);
      }
    };
    setTimeout(type, 900);
  }


  /* ---- DASHBOARD: SEARCH & FILTER ---- */
  const searchInput = document.getElementById('bugSearch');
  const bugsGrid   = document.getElementById('bugsGrid');
  const emptyState = document.getElementById('emptyState');
  const pills      = document.querySelectorAll('.pill');

  // Debounce function to prevent excessive API calls
  function debounce(func, delay = 300) {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => { func.apply(this, args); }, delay);
    };
  }

  if (searchInput) {
    const debouncedSearch = debounce((e) => {
      searchQuery = e.target.value.toLowerCase().trim();
      currentPage = 1; // Reset to first page on new search
      fetchAndRenderBugs();
    }, 300);
    searchInput.addEventListener('input', debouncedSearch);

    // ⌘K / Ctrl+K focus shortcut
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInput.focus();
      }
      if (e.key === 'Escape' && document.activeElement === searchInput) {
        searchInput.blur();
      }
    });
  }

  pills.forEach(pill => {
    pill.addEventListener('click', () => {
      pills.forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      activeFilter = pill.dataset.filter;
      currentPage = 1; // Reset to first page on filter change
      fetchAndRenderBugs();
    });
  });


  /* ---- BUG DETAIL: COPY BUTTONS ---- */
  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const targetId = btn.dataset.target;
      const el = document.getElementById(targetId);
      if (!el) return;

      navigator.clipboard.writeText(el.textContent).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        btn.style.color = 'var(--green)';
        btn.style.borderColor = 'var(--green)';
        setTimeout(() => {
          btn.textContent = orig;
          btn.style.color = '';
          btn.style.borderColor = '';
        }, 1800);
      }).catch(() => {
        // Fallback for older browsers
        const range = document.createRange();
        range.selectNode(el);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
      });
    });
  });


  /* ---- SCROLL FADE-IN (cards) ---- */
  const observerTargets = document.querySelectorAll(
    '.feat-card, .step, .stat-card, .bug-card, .detail-section, .sidebar-card'
  );

  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    observerTargets.forEach((el, i) => {
      io.observe(el);
    });
  }

  /* ---- GLOBAL: NAVBAR SCROLL SHADOW ---- */
  const navbar = document.querySelector('.navbar');
  if (navbar) {
    window.addEventListener('scroll', () => {
      if (window.scrollY > 10) {
        navbar.style.boxShadow = '0 4px 24px rgba(0,0,0,0.3)';
      } else {
        navbar.style.boxShadow = '';
      }
    }, { passive: true });
  }

  /* ---- DASHBOARD: CLEAR SEARCH ---- */
  const clearSearchBtn = document.querySelector('.empty-state .btn');
  if (clearSearchBtn) {
    clearSearchBtn.addEventListener('click', () => {
      const searchInput = document.getElementById('bugSearch');
      if (searchInput) {
        searchInput.value = '';
        // Dispatch event to trigger the filter function
        searchInput.dispatchEvent(new Event('input', { bubbles: true }));
        searchInput.focus();
      }
    });
  }

  // Check if we are on the dashboard page
  if (document.body.classList.contains('dashboard-page') && document.getElementById('bugsGrid')) {
    initializeDashboard();
  }

});

async function initializeDashboard() {
  if (!isAuthenticated()) {
    window.location.href = 'login.html';
    return;
  }

  // Update live date subhead dynamically
  const liveDateSub = document.getElementById('liveDateSub');
  if (liveDateSub) {
    const formattedDate = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    liveDateSub.textContent = `${formattedDate} · Live data`;
  }

  const authNavLink = document.getElementById('authNavLink');
  const authMobLink = document.getElementById('authMobLink');
  const setLogout = (el) => {
    if (!el) return;
    el.textContent = 'Logout';
    el.href = '#';
    el.addEventListener('click', (e) => {
      e.preventDefault();
      logout();
    });
  };
  setLogout(authNavLink);
  setLogout(authMobLink);

  // Advanced Filters Collapsible Toggle
  const toggleFiltersBtn = document.getElementById('toggleFiltersBtn');
  const advancedFilterPanel = document.getElementById('advancedFilterPanel');
  if (toggleFiltersBtn && advancedFilterPanel) {
    toggleFiltersBtn.addEventListener('click', () => {
      const isHidden = advancedFilterPanel.style.display === 'none';
      advancedFilterPanel.style.display = isHidden ? 'block' : 'none';
    });
  }

  const applyFiltersBtn = document.getElementById('applyFiltersBtn');
  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      filterTech = document.getElementById('filterTech').value.trim();
      filterPriority = document.getElementById('filterPriority').value;
      filterAiTool = document.getElementById('filterAiTool').value;
      filterStatus = document.getElementById('filterStatus').value;
      filterStartDate = document.getElementById('filterStartDate').value;
      filterEndDate = document.getElementById('filterEndDate').value;
      currentPage = 1;
      fetchAndRenderBugs();
    });
  }

  const clearFiltersBtn = document.getElementById('clearFiltersBtn');
  if (clearFiltersBtn) {
    clearFiltersBtn.addEventListener('click', () => {
      document.getElementById('filterTech').value = '';
      document.getElementById('filterPriority').value = '';
      document.getElementById('filterAiTool').value = '';
      document.getElementById('filterStatus').value = '';
      document.getElementById('filterStartDate').value = '';
      document.getElementById('filterEndDate').value = '';
      
      filterTech = '';
      filterPriority = '';
      filterAiTool = '';
      filterStatus = '';
      filterStartDate = '';
      filterEndDate = '';
      currentPage = 1;
      fetchAndRenderBugs();
    });
  }

  // Wire up the Export system dropdown triggers
  const exportBtn = document.getElementById('exportBtn');
  const exportMenu = document.getElementById('exportMenu');
  if (exportBtn && exportMenu) {
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportMenu.style.display = exportMenu.style.display === 'none' ? 'block' : 'none';
    });
    document.addEventListener('click', () => {
      exportMenu.style.display = 'none';
    });
    
    exportMenu.querySelectorAll('.export-option').forEach(opt => {
      opt.addEventListener('click', async (e) => {
        e.preventDefault();
        const format = opt.dataset.format;
        
        // Build export query params matching active filters
        const params = new URLSearchParams();
        params.append('format', format);
        if (activeFilter === 'open' || activeFilter === 'resolved') {
          params.append('status', activeFilter);
        } else if (activeFilter === 'favorites') {
          params.append('filter', 'favorites');
        } else if (activeFilter === 'critical') {
          params.append('tag', 'critical');
        }
        
        // Advanced Filters
        if (filterTech) params.append('technology', filterTech);
        if (filterPriority) params.append('priority', filterPriority);
        if (filterAiTool) params.append('aiTool', filterAiTool);
        if (filterStatus) params.append('status', filterStatus);
        if (filterStartDate) params.append('startDate', filterStartDate);
        if (filterEndDate) params.append('endDate', filterEndDate);

        if (searchQuery) params.append('search', searchQuery);

        showToast(`Generating ${format.toUpperCase()} export...`, 'info');
        const blob = await downloadBugsExport(params.toString());
        if (blob) {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `buglog-export-${new Date().toISOString().slice(0, 10)}.${format === 'markdown' ? 'md' : format}`;
          document.body.appendChild(a);
          a.click();
          a.remove();
          window.URL.revokeObjectURL(url);
          showToast('Export downloaded successfully!', 'success');
        } else {
          showToast('Export failed. Please try again.', 'error');
        }
      });
    });
  }

  // Update statistics cards from backend aggregates
  const statsRes = await getAnalytics();
  if (statsRes.success) {
    const stats = statsRes.data.stats;
    document.getElementById('totalBugsVal').textContent = stats.total;
    document.getElementById('openBugsVal').textContent = stats.open;
    document.getElementById('resolvedBugsVal').textContent = stats.resolved;
  }

  fetchAndRenderBugs();
}

async function fetchAndRenderBugs() {
  const bugsGrid = document.getElementById('bugsGrid');
  const emptyState = document.getElementById('emptyState');
  if (emptyState) emptyState.style.display = 'none';

  // Render modern skeleton loading screens
  bugsGrid.innerHTML = Array(3).fill(0).map(() => `
    <div class="skeleton-card skeleton" style="height: 180px; width: 100%;">
      <div class="skeleton-title skeleton"></div>
      <div class="skeleton-text skeleton" style="height: 40px; margin-bottom: 20px;"></div>
      <div class="skeleton-text skeleton" style="width: 50%;"></div>
    </div>
  `).join('');

  // Build query params for the API call
  const params = new URLSearchParams();
  if (activeFilter === 'open' || activeFilter === 'resolved') {
    params.append('status', activeFilter);
  } else if (activeFilter === 'favorites') {
    params.append('filter', 'favorites');
  } else if (activeFilter === 'critical') {
    params.append('tag', 'critical');
  }

  // Advanced Filters
  if (filterTech) params.append('technology', filterTech);
  if (filterPriority) params.append('priority', filterPriority);
  if (filterAiTool) params.append('aiTool', filterAiTool);
  if (filterStatus) params.append('status', filterStatus);
  if (filterStartDate) params.append('startDate', filterStartDate);
  if (filterEndDate) params.append('endDate', filterEndDate);

  if (searchQuery) params.append('search', searchQuery);
  params.append('page', currentPage);

  const res = await getBugs(params.toString());
  if (res.success) {
    renderPaginationControls(res.pagination, res.total);
    renderBugs(res.data);
  } else {
    bugsGrid.innerHTML = `<p style="color:var(--red); padding: 20px; text-align: center;">Failed to load bugs: ${res.message}</p>`;
  }
}

function getSeverity(bug) {
  return bug.priority || bug.severity || 'low';
}

function renderBugs(bugs) {
  const bugsGrid = document.getElementById('bugsGrid');
  bugsGrid.innerHTML = '';
  
  const emptyState = document.getElementById('emptyState');
  if (!bugs || bugs.length === 0) {
    if (emptyState) emptyState.style.display = 'block';
    return;
  }

  const fragment = document.createDocumentFragment();
  bugs.forEach(bug => {
    const severity = getSeverity(bug);
    const tagHtml = (bug.tags || []).map(t => `<span class="tag">${t}</span>`).join('');
    const dateStr = new Date(bug.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    const cardLink = document.createElement('a');
    cardLink.href = `bug-detail.html?id=${bug._id}`;
    cardLink.className = 'bug-card';
    cardLink.dataset.status = bug.status;
    cardLink.dataset.severity = severity;
    cardLink.dataset.tags = (bug.tags || []).join(' ');
    cardLink.innerHTML = `
      <div class="bug-card-top">
        <div class="bug-card-top-left">
          <span class="bug-id">#${bug._id.slice(-4)}</span>
          <button class="favorite-btn ${bug.isFavorited ? 'favorited' : ''}" data-bug-id="${bug._id}" title="Toggle Favorite">★</button>
        </div>
        <span class="severity-badge ${severity}">${severity.toUpperCase()}</span>
        <span class="status-dot ${bug.status}" title="${bug.status}"></span>
      </div>
      <div class="bug-card-content">
        <h3 class="bug-title">${bug.title}</h3>
        <p class="bug-excerpt">${bug.errorMessage}</p>
      </div>
      <div class="bug-meta">
        <div class="bug-tags">${tagHtml}</div>
        <span class="bug-date">${dateStr}</span>
      </div>
    `;
    fragment.appendChild(cardLink);
  });
  bugsGrid.appendChild(fragment);

  // Add event listeners for favorite buttons
  bugsGrid.querySelectorAll('.favorite-btn').forEach(btn => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault(); // Prevent navigation
      e.stopPropagation(); // Prevent card click
      const bugId = e.target.dataset.bugId;
      const res = await toggleFavorite(bugId);
      if (res.success) {
        e.target.classList.toggle('favorited', res.data.isFavorited);
        showToast(res.data.isFavorited ? 'Bug added to favorites' : 'Bug removed from favorites', 'success');
      } else {
        showToast('Failed to update favorite status.', 'error');
      }
    });
  });
}

function renderPaginationControls(pagination, total) {
  const controlsContainer = document.getElementById('paginationControls');
  if (!controlsContainer || !pagination || pagination.totalPages <= 1) {
    controlsContainer.innerHTML = '';
    return;
  }

  const { currentPage, totalPages } = pagination;

  let html = '';
  if (currentPage > 1) {
    html += `<button class="pagination-btn" data-page="${currentPage - 1}">← Prev</button>`;
  }

  // Basic page numbers (can be expanded)
  for (let i = 1; i <= totalPages; i++) {
    html += `<button class="pagination-btn ${i === currentPage ? 'active' : ''}" data-page="${i}">${i}</button>`;
  }

  if (currentPage < totalPages) {
    html += `<button class="pagination-btn" data-page="${currentPage + 1}">Next →</button>`;
  }

  controlsContainer.innerHTML = html;

  // Add event listeners
  controlsContainer.querySelectorAll('.pagination-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      currentPage = parseInt(e.target.dataset.page, 10);
      fetchAndRenderBugs();
    });
  });
}

// Global Toast notification utility
window.showToast = function(message, type = 'info') {
  let container = document.getElementById('toastContainer');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  
  let icon = 'ℹ️';
  if (type === 'success') icon = '✔';
  else if (type === 'error') icon = '✖';
  else if (type === 'warning') icon = '⚠';

  toast.innerHTML = `<span style="font-weight: bold; margin-right: 8px;">${icon}</span><span>${message}</span>`;
  container.appendChild(toast);

  // Auto remove toast after 4 seconds
  setTimeout(() => {
    toast.classList.add('fade-out');
    setTimeout(() => {
      toast.remove();
      if (container.children.length === 0) {
        container.remove();
      }
    }, 300);
  }, 4000);
};
