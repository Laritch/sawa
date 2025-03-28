/**
 * WhiteboardRecordingAnalytics
 * Provides AI-powered analytics and insights for whiteboard recordings
 */
class WhiteboardRecordingAnalytics {
  constructor(options = {}) {
    this.whiteboardManager = options.whiteboardManager;
    this.webinarId = options.webinarId;
    this.userId = options.userId;
    this.socket = options.socket;

    this.currentRecordingId = null;
    this.currentWhiteboardId = null;
    this.player = null;
    this.analysisResults = {};
    this.contentKeywords = [];
    this.participationData = [];
    this.summaries = {};
    this.insightPrompts = [
      "What are the key points from this recording?",
      "Summarize the main ideas discussed",
      "What decisions were made in this session?",
      "Extract action items from this recording",
      "Identify knowledge gaps in this session"
    ];

    this.initialize();
  }

  /**
   * Initialize analytics
   */
  initialize() {
    this.setupEventListeners();
    this.setupSocketListeners();
  }

  /**
   * Setup socket listeners for analytics events
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Listen for analysis completion
    this.socket.on('recording:analysis:completed', (data) => {
      if (this.currentRecordingId === data.recordingId) {
        this.analysisResults = data.results;
        this.contentKeywords = data.keywords || [];
        this.renderAnalysisResults();

        // Show notification
        this.showNotification('Analysis completed', 'AI analysis of your recording is now available.');
      }
    });

    // Listen for new summaries
    this.socket.on('recording:summary:created', (data) => {
      if (this.currentRecordingId === data.recordingId) {
        this.summaries[data.summaryType] = data.summary;
        this.renderSummaries();
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.addEventListener('click', (event) => {
      // Handle analytics request buttons
      if (event.target.closest('.request-analysis-btn')) {
        this.requestAnalysis(this.currentWhiteboardId, this.currentRecordingId);
      }

      // Handle summary generation
      if (event.target.closest('.generate-summary-btn')) {
        const summaryType = event.target.closest('.generate-summary-btn').dataset.type;
        this.generateSummary(this.currentWhiteboardId, this.currentRecordingId, summaryType);
      }

      // Handle insight prompt buttons
      if (event.target.closest('.insight-prompt-btn')) {
        const promptIndex = event.target.closest('.insight-prompt-btn').dataset.index;
        const prompt = this.insightPrompts[promptIndex];
        this.generateInsight(this.currentWhiteboardId, this.currentRecordingId, prompt);
      }
    });
  }

  /**
   * Set the player reference and current recording
   * @param {Object} player - Recording player reference
   * @param {String} whiteboardId - Current whiteboard ID
   * @param {String} recordingId - Current recording ID
   */
  setPlayer(player, whiteboardId, recordingId) {
    this.player = player;
    this.currentWhiteboardId = whiteboardId;
    this.currentRecordingId = recordingId;

    // Load any existing analysis
    this.loadAnalysis(whiteboardId, recordingId);
  }

  /**
   * Load existing analysis for a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  loadAnalysis(whiteboardId, recordingId) {
    if (!whiteboardId || !recordingId) return;

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/analysis`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.analysisResults = data.analysis || {};
        this.contentKeywords = data.keywords || [];
        this.participationData = data.participation || [];
        this.summaries = data.summaries || {};

        // Render the UI with the loaded data
        this.renderAnalysisResults();
        this.renderSummaries();
        this.renderParticipationData();
      }
    })
    .catch(error => {
      console.error('Error loading recording analysis:', error);
    });
  }

  /**
   * Request AI analysis of a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  requestAnalysis(whiteboardId, recordingId) {
    if (!whiteboardId || !recordingId) return;

    const analysisBtn = document.querySelector('.request-analysis-btn');
    if (analysisBtn) {
      analysisBtn.disabled = true;
      analysisBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Analyzing...';
    }

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/analyze`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        requestedBy: this.userId
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showNotification('Analysis started', 'We are analyzing your recording. This may take a few minutes.');
      } else {
        if (analysisBtn) {
          analysisBtn.disabled = false;
          analysisBtn.innerHTML = 'Analyze Recording';
        }
        this.showNotification('Analysis failed', data.message || 'Failed to start analysis.');
      }
    })
    .catch(error => {
      console.error('Error requesting recording analysis:', error);
      if (analysisBtn) {
        analysisBtn.disabled = false;
        analysisBtn.innerHTML = 'Analyze Recording';
      }
    });
  }

  /**
   * Generate a summary of the recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {String} summaryType - Type of summary (brief, detailed, actionItems)
   */
  generateSummary(whiteboardId, recordingId, summaryType) {
    if (!whiteboardId || !recordingId || !summaryType) return;

    const summaryBtn = document.querySelector(`.generate-summary-btn[data-type="${summaryType}"]`);
    if (summaryBtn) {
      summaryBtn.disabled = true;
      summaryBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/summarize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        summaryType: summaryType
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showNotification('Summary generation started', 'We are generating a summary of your recording.');
      } else {
        if (summaryBtn) {
          summaryBtn.disabled = false;
          summaryBtn.innerHTML = this.getSummaryButtonText(summaryType);
        }
        this.showNotification('Summary generation failed', data.message || 'Failed to generate summary.');
      }
    })
    .catch(error => {
      console.error('Error generating recording summary:', error);
      if (summaryBtn) {
        summaryBtn.disabled = false;
        summaryBtn.innerHTML = this.getSummaryButtonText(summaryType);
      }
    });
  }

  /**
   * Generate an insight based on a prompt
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {String} prompt - Insight prompt
   */
  generateInsight(whiteboardId, recordingId, prompt) {
    if (!whiteboardId || !recordingId || !prompt) return;

    const insightContainer = document.querySelector('.ai-insights-content');
    if (insightContainer) {
      const loadingEl = document.createElement('div');
      loadingEl.className = 'ai-insight-loading';
      loadingEl.innerHTML = `
        <div class="loading-spinner"><i class="fas fa-spinner fa-spin"></i></div>
        <div class="loading-text">Generating insight: "${prompt}"</div>
      `;
      insightContainer.appendChild(loadingEl);
    }

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/insight`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: this.userId,
        prompt: prompt
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.insight) {
        this.renderInsight(data.insight, prompt);
      } else {
        this.showNotification('Insight generation failed', data.message || 'Failed to generate insight.');
      }

      // Remove loading element
      const loadingEl = document.querySelector('.ai-insight-loading');
      if (loadingEl) loadingEl.remove();
    })
    .catch(error => {
      console.error('Error generating insight:', error);
      // Remove loading element
      const loadingEl = document.querySelector('.ai-insight-loading');
      if (loadingEl) loadingEl.remove();
    });
  }

  /**
   * Render an insight in the UI
   * @param {String} insightText - The insight text
   * @param {String} prompt - The prompt that generated the insight
   */
  renderInsight(insightText, prompt) {
    const insightContainer = document.querySelector('.ai-insights-content');
    if (!insightContainer) return;

    const insightEl = document.createElement('div');
    insightEl.className = 'ai-insight-item';
    insightEl.innerHTML = `
      <div class="ai-insight-prompt">${prompt}</div>
      <div class="ai-insight-text">${insightText}</div>
      <div class="ai-insight-actions">
        <button class="copy-insight-btn"><i class="fas fa-copy"></i> Copy</button>
        <button class="remove-insight-btn"><i class="fas fa-times"></i> Remove</button>
      </div>
    `;

    // Add event listener for copy button
    const copyBtn = insightEl.querySelector('.copy-insight-btn');
    copyBtn.addEventListener('click', () => {
      navigator.clipboard.writeText(insightText)
        .then(() => this.showNotification('Copied', 'Insight copied to clipboard.'))
        .catch(err => console.error('Failed to copy insight:', err));
    });

    // Add event listener for remove button
    const removeBtn = insightEl.querySelector('.remove-insight-btn');
    removeBtn.addEventListener('click', () => {
      insightEl.remove();
    });

    insightContainer.appendChild(insightEl);
  }

  /**
   * Get button text based on summary type
   * @param {String} summaryType - Type of summary
   * @returns {String} Button text
   */
  getSummaryButtonText(summaryType) {
    switch (summaryType) {
      case 'brief':
        return 'Generate Brief Summary';
      case 'detailed':
        return 'Generate Detailed Summary';
      case 'actionItems':
        return 'Extract Action Items';
      default:
        return 'Generate Summary';
    }
  }

  /**
   * Render analysis results in the UI
   */
  renderAnalysisResults() {
    const analyticsContainer = document.querySelector('#analytics-tab-content');
    if (!analyticsContainer || !this.analysisResults) return;

    // Content analysis results
    if (this.analysisResults.contentAnalysis) {
      const contentAnalysisEl = document.querySelector('.content-analysis-results') || document.createElement('div');
      contentAnalysisEl.className = 'content-analysis-results';
      contentAnalysisEl.innerHTML = `
        <h4>Content Analysis</h4>
        <div class="analysis-item">
          <div class="analysis-label">Content Type Breakdown</div>
          <div class="analysis-chart content-type-chart" id="contentTypeChart"></div>
        </div>
        <div class="analysis-item">
          <div class="analysis-label">Key Concepts</div>
          <div class="keyword-cloud">${this.renderKeywordCloud()}</div>
        </div>
      `;
      analyticsContainer.appendChild(contentAnalysisEl);

      // Initialize charts (in a real implementation, this would use a charting library)
      this.initContentAnalysisCharts();
    }
  }

  /**
   * Render keyword cloud from extracted keywords
   * @returns {String} HTML for keyword cloud
   */
  renderKeywordCloud() {
    if (!this.contentKeywords || this.contentKeywords.length === 0) {
      return '<div class="empty-state">No keywords extracted yet</div>';
    }

    return this.contentKeywords.map(keyword => {
      const size = keyword.weight * 20 + 12; // Scale font size based on keyword weight
      return `<span class="keyword" style="font-size: ${size}px">${keyword.text}</span>`;
    }).join(' ');
  }

  /**
   * Initialize content analysis charts
   * This would typically use a charting library like Chart.js
   */
  initContentAnalysisCharts() {
    // This is a simplified implementation
    // In a real implementation, this would use a charting library to render charts
    console.log('Initializing content analysis charts');
  }

  /**
   * Render summaries in the UI
   */
  renderSummaries() {
    const summariesContainer = document.querySelector('.recording-summaries');
    if (!summariesContainer) return;

    if (Object.keys(this.summaries).length === 0) {
      summariesContainer.innerHTML = `
        <div class="empty-state">
          <p>No summaries generated yet. Generate a summary to get started.</p>
          <div class="summary-actions">
            <button class="generate-summary-btn" data-type="brief">Generate Brief Summary</button>
            <button class="generate-summary-btn" data-type="detailed">Generate Detailed Summary</button>
            <button class="generate-summary-btn" data-type="actionItems">Extract Action Items</button>
          </div>
        </div>
      `;
      return;
    }

    let summariesHTML = '<div class="summary-tabs">';
    let summariesContentHTML = '<div class="summary-content">';

    Object.keys(this.summaries).forEach((type, index) => {
      const isActive = index === 0 ? 'active' : '';
      const title = this.getSummaryTitle(type);

      summariesHTML += `<button class="summary-tab ${isActive}" data-type="${type}">${title}</button>`;

      summariesContentHTML += `
        <div class="summary-pane ${isActive}" data-type="${type}">
          <div class="summary-text">${this.summaries[type]}</div>
          <div class="summary-actions">
            <button class="copy-summary-btn" data-type="${type}">
              <i class="fas fa-copy"></i> Copy
            </button>
            <button class="regenerate-summary-btn" data-type="${type}">
              <i class="fas fa-redo"></i> Regenerate
            </button>
          </div>
        </div>
      `;
    });

    summariesHTML += '</div>';
    summariesContentHTML += '</div>';

    summariesContainer.innerHTML = summariesHTML + summariesContentHTML;

    // Setup tab switching functionality
    const tabs = summariesContainer.querySelectorAll('.summary-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const type = tab.dataset.type;

        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active content
        const panes = summariesContainer.querySelectorAll('.summary-pane');
        panes.forEach(pane => {
          if (pane.dataset.type === type) {
            pane.classList.add('active');
          } else {
            pane.classList.remove('active');
          }
        });
      });
    });

    // Setup copy functionality
    const copyBtns = summariesContainer.querySelectorAll('.copy-summary-btn');
    copyBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        navigator.clipboard.writeText(this.summaries[type])
          .then(() => this.showNotification('Copied', 'Summary copied to clipboard.'))
          .catch(err => console.error('Failed to copy summary:', err));
      });
    });

    // Setup regenerate functionality
    const regenerateBtns = summariesContainer.querySelectorAll('.regenerate-summary-btn');
    regenerateBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type;
        this.generateSummary(this.currentWhiteboardId, this.currentRecordingId, type);
      });
    });
  }

  /**
   * Get summary title based on type
   * @param {String} type - Summary type
   * @returns {String} Summary title
   */
  getSummaryTitle(type) {
    switch (type) {
      case 'brief':
        return 'Brief Summary';
      case 'detailed':
        return 'Detailed Summary';
      case 'actionItems':
        return 'Action Items';
      default:
        return 'Summary';
    }
  }

  /**
   * Render participation data
   */
  renderParticipationData() {
    const participationContainer = document.querySelector('.participation-metrics');
    if (!participationContainer || !this.participationData || this.participationData.length === 0) return;

    participationContainer.innerHTML = `
      <h4>Participation Metrics</h4>
      <div class="participation-chart" id="participationChart"></div>
      <div class="participation-timeline" id="participationTimeline"></div>
    `;

    // Initialize participation charts (in a real implementation, this would use a charting library)
    this.initParticipationCharts();
  }

  /**
   * Initialize participation charts
   * This would typically use a charting library like Chart.js
   */
  initParticipationCharts() {
    // This is a simplified implementation
    // In a real implementation, this would use a charting library to render charts
    console.log('Initializing participation charts');
  }

  /**
   * Show a notification toast
   * @param {String} title - Notification title
   * @param {String} message - Notification message
   */
  showNotification(title, message) {
    // This would typically be implemented in a shared utilities class
    console.log(`Notification: ${title} - ${message}`);

    const notificationContainer = document.querySelector('.notification-container') ||
      (() => {
        const container = document.createElement('div');
        container.className = 'notification-container';
        document.body.appendChild(container);
        return container;
      })();

    const notificationId = `notification-${Date.now()}`;
    const notification = document.createElement('div');
    notification.className = 'notification-toast';
    notification.id = notificationId;
    notification.innerHTML = `
      <div class="notification-header">
        <span class="notification-title">${title}</span>
        <button class="close-notification"><i class="fas fa-times"></i></button>
      </div>
      <div class="notification-body">${message}</div>
    `;

    notificationContainer.appendChild(notification);

    // Add event listener for close button
    notification.querySelector('.close-notification').addEventListener('click', () => {
      notification.classList.add('notification-hiding');
      setTimeout(() => notification.remove(), 300);
    });

    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (document.getElementById(notificationId)) {
        notification.classList.add('notification-hiding');
        setTimeout(() => notification.remove(), 300);
      }
    }, 5000);

    // Add entrance animation class after insertion to trigger animation
    setTimeout(() => notification.classList.add('notification-show'), 10);
  }
}

// Export the class
window.WhiteboardRecordingAnalytics = WhiteboardRecordingAnalytics;
