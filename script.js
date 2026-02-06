/**
 * Instagram Followers Analyzer
 * Analyzes Instagram following/followers data and identifies users who don't follow back
 */

class InstagramAnalyzer {
  constructor() {
    this.init();
  }

  async init() {
    // Load instructions from separate file
    await this.loadInstructions();

    // Initialize accordion after instructions are loaded
    // Wait a bit more to ensure DOM is fully updated
    await new Promise(resolve => setTimeout(resolve, 150));
    this.initAccordion();

    // Set up event listeners
    const analyzeButton = document.querySelector('#analyzeButton');
    if (analyzeButton) {
      analyzeButton.addEventListener('click', () => this.analyze());
    }

    // Allow Enter key to trigger analysis (Ctrl+Enter)
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        this.analyze();
      }
    });
  }

  /**
   * Load instructions from separate HTML file
   */
  async loadInstructions() {
    const container = document.getElementById('instructions-container');
    if (!container) {
      console.error('Instructions container not found');
      return;
    }

    try {
      const response = await fetch('instructions.html');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const html = await response.text();
      container.innerHTML = html;
      console.log('Instructions loaded successfully');
    } catch (error) {
      console.error('Error loading instructions:', error);
      container.innerHTML = `
        <div class="accordion-item">
          <div class="accordion-header" style="background: #ff9800;">
            <span class="title-wrapper">
              <span>⚠️ Помилка завантаження інструкції</span>
            </span>
          </div>
          <div class="accordion-content" style="padding: 20px;">
            <p style="color: var(--text-secondary); text-align: center;">
              Не вдалося завантажити інструкцію з файлу instructions.html.<br>
              Переконайтеся, що файл існує і доступний.<br>
              Помилка: ${error.message}
            </p>
          </div>
        </div>
      `;
    }
  }

  /**
   * Initialize accordion functionality for instructions
   */
  initAccordion() {
    // Find accordion header specifically in instructions section
    const instructionsContainer = document.getElementById('instructions-container');
    if (!instructionsContainer) {
      console.warn('Instructions container not found');
      return;
    }

    const accordionHeader = instructionsContainer.querySelector('.accordion-header');
    if (!accordionHeader) {
      console.warn('Accordion header not found in instructions');
      return;
    }

    const content = instructionsContainer.querySelector('#instructions-panel');
    if (!content) {
      console.warn('Instructions panel not found');
      return;
    }

    console.log('Initializing accordion for instructions');

    // Add click event listener directly (don't clone to preserve any existing handlers)
    accordionHeader.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const isExpanded = accordionHeader.getAttribute('aria-expanded') === 'true';
      const panel = document.getElementById('instructions-panel');
      
      if (!panel) {
        console.error('Panel not found');
        return;
      }

      console.log('Toggling accordion, was expanded:', isExpanded);
      
      accordionHeader.setAttribute('aria-expanded', !isExpanded);
      
      // Update arrow
      const arrow = accordionHeader.querySelector('.arrow');
      if (arrow) {
        arrow.textContent = isExpanded ? '▶' : '▼';
      }
      
      // Toggle content visibility
      if (isExpanded) {
        panel.setAttribute('hidden', '');
        console.log('Accordion closed');
      } else {
        panel.removeAttribute('hidden');
        console.log('Accordion opened');
      }
    });

    console.log('Accordion initialized successfully');
  }

  /**
   * Extract usernames from Instagram JSON data
   * @param {Array} data - Raw Instagram data array
   * @returns {Array} Array of objects with username and href
   */
  extractUsernames(data) {
    if (!Array.isArray(data)) {
      return [];
    }

    return data
      .map((item) => {
        const entry = item.string_list_data?.[0];
        return {
          username: entry?.value || item.title || '',
          href: entry?.href || ''
        };
      })
      .filter((x) => x.username);
  }

  /**
   * Parse JSON input with error handling
   * @param {string} input - JSON string input
   * @returns {Object|null} Parsed JSON object or null if invalid
   */
  parseJSON(input) {
    if (!input || !input.trim()) {
      return null;
    }

    try {
      return JSON.parse(input);
    } catch (error) {
      console.error('JSON parsing error:', error);
      alert('Помилка парсингу JSON. Перевірте правильність формату даних.');
      return null;
    }
  }

  /**
   * Main analysis function
   */
  analyze() {
    const followingInput = document.getElementById('followingInput');
    const followersInput = document.getElementById('followersInput');
    const resultsDiv = document.getElementById('results');
    const button = document.querySelector('button');

    // Get input values
    const followingRaw = this.parseJSON(followingInput.value);
    const followersRaw = this.parseJSON(followersInput.value);

    // Validate inputs
    if (!followingRaw || !followersRaw) {
      return;
    }

    // Show loading state
    button.disabled = true;
    button.textContent = 'Аналізую...';
    resultsDiv.innerHTML = '<div class="loading"><div class="spinner"></div>Обробка даних...</div>';

    // Process data asynchronously to prevent UI blocking
    setTimeout(() => {
      try {
        // Extract usernames
        const following = this.extractUsernames(
          followingRaw.relationships_following || followingRaw
        );
        const followers = this.extractUsernames(
          followersRaw.relationships_followers || followersRaw
        );

        // Create sets for efficient lookup
        const followersSet = new Set(followers.map((x) => x.username.toLowerCase()));

        // Find users who don't follow back
        const notFollowingBack = following.filter(
          (x) => !followersSet.has(x.username.toLowerCase())
        );

        // Display results
        this.displayResults(following, followers, notFollowingBack);

        // Reset button
        button.disabled = false;
        button.textContent = 'Аналізувати';
      } catch (error) {
        console.error('Analysis error:', error);
        alert('Помилка під час аналізу. Перевірте формат даних.');
        button.disabled = false;
        button.textContent = 'Аналізувати';
        resultsDiv.innerHTML = '';
      }
    }, 100);
  }

  /**
   * Display analysis results
   * @param {Array} following - Users being followed
   * @param {Array} followers - Users who follow back
   * @param {Array} notFollowingBack - Users who don't follow back
   */
  displayResults(following, followers, notFollowingBack) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.innerHTML = '';

    // Create sections
    resultsDiv.appendChild(
      this.createSection('Following', following, false, '👥')
    );
    resultsDiv.appendChild(
      this.createSection('Followers', followers, false, '👤')
    );
    resultsDiv.appendChild(
      this.createSection('Не підписані у відповідь', notFollowingBack, true, '⚠️')
    );

    // Scroll to results
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }

  /**
   * Create a collapsible section
   * @param {string} title - Section title
   * @param {Array} data - Data to display
   * @param {boolean} highlight - Whether to highlight rows
   * @param {string} icon - Icon emoji
   * @returns {HTMLElement} Section element
   */
  createSection(title, data, highlight, icon = '') {
    const section = document.createElement('div');
    section.className = 'section';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
      <span class="title-wrapper">
        <span class="arrow">▶</span>
        ${icon ? `<span>${icon}</span>` : ''}
        <span>${title}</span>
        <span class="count">(${data.length})</span>
      </span>
    `;

    const content = document.createElement('div');
    content.className = 'section-content';

    // Toggle functionality
    header.addEventListener('click', () => {
      const isOpen = content.classList.contains('open');
      content.classList.toggle('open');
      header.classList.toggle('open');
      
      const arrow = header.querySelector('.arrow');
      arrow.textContent = isOpen ? '▶' : '▼';
    });

    // Create table or empty state
    if (data.length > 0) {
      content.appendChild(this.createTable(data, highlight));
    } else {
      content.innerHTML = '<div class="empty-state"><div class="empty-state-icon">📭</div><p>Немає даних</p></div>';
    }

    section.appendChild(header);
    section.appendChild(content);

    return section;
  }

  /**
   * Create a table from data
   * @param {Array} data - Data to display in table
   * @param {boolean} highlight - Whether to highlight rows
   * @returns {HTMLElement} Table element
   */
  createTable(data, highlight) {
    const wrapper = document.createElement('div');
    wrapper.className = 'table-wrapper';

    const table = document.createElement('table');
    table.innerHTML = `
      <thead>
        <tr>
          <th>Username</th>
          <th>Link</th>
        </tr>
      </thead>
      <tbody></tbody>
    `;

    const tbody = table.querySelector('tbody');

    data.forEach((item) => {
      const tr = document.createElement('tr');
      if (highlight) {
        tr.classList.add('not-following');
      }

      const usernameCell = document.createElement('td');
      usernameCell.textContent = item.username;

      const linkCell = document.createElement('td');
      if (item.href) {
        const link = document.createElement('a');
        link.href = item.href;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.textContent = item.href;
        linkCell.appendChild(link);
      } else {
        linkCell.textContent = '-';
        linkCell.style.color = 'var(--text-secondary)';
      }

      tr.appendChild(usernameCell);
      tr.appendChild(linkCell);
      tbody.appendChild(tr);
    });

    wrapper.appendChild(table);
    return wrapper;
  }
}

// Initialize the analyzer when DOM is ready
let analyzer;

document.addEventListener('DOMContentLoaded', async () => {
  analyzer = new InstagramAnalyzer();
  // init() is async, so it will handle loading instructions
});

// Global function for backward compatibility with onclick
function analyze() {
  if (analyzer) {
    analyzer.analyze();
  }
}
