/**
 * WhiteboardRecordingExportEnhanced
 * Provides enhanced export options for whiteboard recordings
 */
class WhiteboardRecordingExportEnhanced {
  constructor(options = {}) {
    this.whiteboardManager = options.whiteboardManager;
    this.webinarId = options.webinarId;
    this.userId = options.userId;
    this.socket = options.socket;

    this.currentRecordingId = null;
    this.currentWhiteboardId = null;
    this.player = null;
    this.exports = [];
    this.exportFormats = [
      { id: 'json', name: 'JSON Data', description: 'Raw recording data in JSON format' },
      { id: 'mp4', name: 'MP4 Video', description: 'Recording as video with standard playback' },
      { id: 'png-sequence', name: 'PNG Sequence', description: 'Sequence of PNG images for each frame' },
      { id: 'pdf', name: 'PDF Document', description: 'Document with annotations as comments' },
      { id: 'html', name: 'Interactive HTML', description: 'Self-contained interactive HTML page' }
    ];

    this.lmsIntegrations = [
      { id: 'canvas', name: 'Canvas', icon: 'fa-graduation-cap' },
      { id: 'blackboard', name: 'Blackboard', icon: 'fa-chalkboard' },
      { id: 'moodle', name: 'Moodle', icon: 'fa-book' },
      { id: 'google-classroom', name: 'Google Classroom', icon: 'fa-google' }
    ];

    this.initialize();
  }

  /**
   * Initialize enhanced exporter
   */
  initialize() {
    this.setupEventListeners();
    this.setupSocketListeners();
  }

  /**
   * Setup socket listeners for export events
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Listen for export status updates
    this.socket.on('recording:export:completed', (data) => {
      if (this.currentRecordingId === data.recordingId) {
        // Update export status
        this.updateExportStatus(data.exportId, 'completed', data.url);
        this.renderExports();

        this.showNotification('Export completed', `Your export in ${data.format} format is ready for download.`);
      }
    });

    // Listen for export progress updates
    this.socket.on('recording:export:progress', (data) => {
      if (this.currentRecordingId === data.recordingId) {
        // Update export progress
        this.updateExportStatus(data.exportId, 'processing', null, data.progress);
        this.renderExports();
      }
    });

    // Listen for transcript generation completion
    this.socket.on('recording:transcript:completed', (data) => {
      if (this.currentRecordingId === data.recordingId) {
        this.showNotification('Transcript ready', 'Your recording transcript is now available.');
        this.loadTranscript();
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.addEventListener('click', (event) => {
      // Handle export format selection
      if (event.target.closest('.export-format-select')) {
        const formatId = event.target.closest('.export-format-select').value;
        this.updateExportSettings({ format: formatId });
      }

      // Handle export request button
      if (event.target.closest('.request-export-btn')) {
        const formatId = document.querySelector('.export-format-select')?.value || 'mp4';
        this.requestExport(this.currentWhiteboardId, this.currentRecordingId, formatId);
      }

      // Handle transcript generation button
      if (event.target.closest('.generate-transcript-btn')) {
        this.generateTranscript(this.currentWhiteboardId, this.currentRecordingId);
      }

      // Handle LMS sharing buttons
      if (event.target.closest('.lms-share-btn')) {
        const lmsId = event.target.closest('.lms-share-btn').dataset.lms;
        this.shareLMS(this.currentWhiteboardId, this.currentRecordingId, lmsId);
      }
    });
  }

  /**
   * Set the player reference and current recording
   * @param {Object} player - Recording player reference
   * @param {String} whiteboardId - Current whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  setPlayer(player, whiteboardId, recordingId) {
    this.player = player;
    this.currentWhiteboardId = whiteboardId;
    this.currentRecordingId = recordingId;

    // Load exports for this recording
    this.loadExports(whiteboardId, recordingId);

    // Load transcript if available
    this.loadTranscript();
  }

  /**
   * Load exports for a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  loadExports(whiteboardId, recordingId) {
    if (!whiteboardId || !recordingId) return;

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/exports`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.exports = data.exports || [];
        this.renderExports();
      }
    })
    .catch(error => {
      console.error('Error loading exports:', error);
    });
  }

  /**
   * Request export of a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {String} format - Export format
   */
  requestExport(whiteboardId, recordingId, format) {
    if (!whiteboardId || !recordingId) return;

    // Check if we have an in-progress export of this format
    const inProgressExport = this.exports.find(e => e.format === format && e.status === 'processing');
    if (inProgressExport) {
      this.showNotification('Export in progress', `An export in ${format} format is already being processed.`);
      return;
    }

    // Disable export button
    const exportBtn = document.querySelector('.request-export-btn');
    if (exportBtn) {
      exportBtn.disabled = true;
      exportBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
    }

    // Get export settings
    const includeAnnotations = document.querySelector('#include-annotations')?.checked ?? true;
    const includeChat = document.querySelector('#include-chat')?.checked ?? false;
    const qualitySetting = document.querySelector('.quality-select')?.value || 'standard';

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        format: format,
        requestedBy: this.userId,
        settings: {
          includeAnnotations: includeAnnotations,
          includeChat: includeChat,
          quality: qualitySetting
        }
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Add to exports list
        this.exports.push({
          id: data.exportId,
          format: format,
          status: 'processing',
          progress: 0,
          requestedAt: new Date().toISOString(),
          requestedBy: {
            id: this.userId,
            name: 'You'
          }
        });

        this.renderExports();
        this.showNotification('Export started', `We're processing your export in ${format} format. This may take a few minutes.`);
      } else {
        this.showNotification('Export failed', data.message || 'Failed to start export process.');
      }

      // Re-enable export button
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = 'Export Recording';
      }
    })
    .catch(error => {
      console.error('Error requesting export:', error);

      // Re-enable export button
      if (exportBtn) {
        exportBtn.disabled = false;
        exportBtn.innerHTML = 'Export Recording';
      }

      this.showNotification('Export failed', 'An error occurred while requesting the export.');
    });
  }

  /**
   * Update export status
   * @param {String} exportId - Export ID
   * @param {String} status - Export status (processing, completed, failed)
   * @param {String} url - Export URL (for completed exports)
   * @param {Number} progress - Export progress percentage (0-100)
   */
  updateExportStatus(exportId, status, url = null, progress = null) {
    const exportIndex = this.exports.findIndex(exp => exp.id === exportId);
    if (exportIndex === -1) return;

    // Update export
    this.exports[exportIndex].status = status;
    if (url) this.exports[exportIndex].url = url;
    if (progress !== null) this.exports[exportIndex].progress = progress;

    if (status === 'completed') {
      this.exports[exportIndex].completedAt = new Date().toISOString();
    }
  }

  /**
   * Generate transcript for a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  generateTranscript(whiteboardId, recordingId) {
    if (!whiteboardId || !recordingId) return;

    // Update UI to show loading
    const transcriptBtn = document.querySelector('.generate-transcript-btn');
    if (transcriptBtn) {
      transcriptBtn.disabled = true;
      transcriptBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
    }

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/transcript`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        requestedBy: this.userId
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showNotification('Transcript generation started', 'We are generating a transcript of your recording. This may take a few minutes.');
      } else {
        if (transcriptBtn) {
          transcriptBtn.disabled = false;
          transcriptBtn.innerHTML = 'Generate Transcript';
        }
        this.showNotification('Transcript generation failed', data.message || 'Failed to start transcript generation.');
      }
    })
    .catch(error => {
      console.error('Error generating transcript:', error);
      if (transcriptBtn) {
        transcriptBtn.disabled = false;
        transcriptBtn.innerHTML = 'Generate Transcript';
      }
    });
  }

  /**
   * Load transcript for current recording
   */
  loadTranscript() {
    if (!this.currentWhiteboardId || !this.currentRecordingId) return;

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${this.currentWhiteboardId}/recordings/${this.currentRecordingId}/transcript`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.transcript) {
        const transcriptContainer = document.querySelector('.transcript-content');
        if (transcriptContainer) {
          this.renderTranscript(transcriptContainer, data.transcript);
        }

        // Update UI to show transcript is available
        const transcriptBtn = document.querySelector('.generate-transcript-btn');
        if (transcriptBtn) {
          transcriptBtn.disabled = true;
          transcriptBtn.innerHTML = 'Transcript Available';
        }
      }
    })
    .catch(error => {
      console.error('Error loading transcript:', error);
    });
  }

  /**
   * Render transcript in the UI
   * @param {HTMLElement} container - Container element
   * @param {Array} transcript - Transcript data
   */
  renderTranscript(container, transcript) {
    if (!container || !transcript) return;

    let html = '<div class="transcript-entries">';

    transcript.forEach(entry => {
      const timestamp = this.formatTime(entry.timestamp);

      html += `
        <div class="transcript-entry" data-timestamp="${entry.timestamp}">
          <div class="transcript-timestamp" onClick="seekToTime(${entry.timestamp})">${timestamp}</div>
          <div class="transcript-text">${entry.text}</div>
        </div>
      `;
    });

    html += '</div>';

    container.innerHTML = html;

    // Add click handlers for seeking
    const seekToTime = (time) => {
      if (this.player) {
        this.player.seekToTime(time);
      }
    };

    // Make seekToTime available to onclick handlers
    window.seekToTime = seekToTime;
  }

  /**
   * Share recording with LMS
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {String} lmsId - LMS ID (canvas, blackboard, moodle, etc.)
   */
  shareLMS(whiteboardId, recordingId, lmsId) {
    if (!whiteboardId || !recordingId || !lmsId) return;

    // Get LMS details
    const lms = this.lmsIntegrations.find(l => l.id === lmsId);
    if (!lms) return;

    this.showNotification('Preparing share', `Preparing to share with ${lms.name}...`);

    // TODO: Implement actual LMS sharing logic
    // This would connect to the LMS API and create a new resource

    // For now, we'll simulate the sharing process
    setTimeout(() => {
      this.showLMSShareModal(lms);
    }, 1000);
  }

  /**
   * Show LMS sharing modal
   * @param {Object} lms - LMS details object
   */
  showLMSShareModal(lms) {
    // Create modal if it doesn't exist
    let modal = document.querySelector('.lms-share-modal');
    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'lms-share-modal';
      modal.innerHTML = `
        <div class="lms-share-modal-content">
          <div class="lms-share-modal-header">
            <h3 class="lms-share-modal-title">Share with <span class="lms-name"></span></h3>
            <button class="close-modal-btn">&times;</button>
          </div>
          <div class="lms-share-modal-body">
            <div class="form-group">
              <label for="lms-course">Course:</label>
              <select id="lms-course" class="lms-course-select">
                <option value="course1">Introduction to Computer Science</option>
                <option value="course2">Advanced Mathematics</option>
                <option value="course3">Physics 101</option>
              </select>
            </div>
            <div class="form-group">
              <label for="lms-module">Module/Section:</label>
              <select id="lms-module" class="lms-module-select">
                <option value="module1">Week 1: Introduction</option>
                <option value="module2">Week 2: Fundamentals</option>
                <option value="module3">Week 3: Advanced Concepts</option>
              </select>
            </div>
            <div class="form-group">
              <label for="lms-title">Resource Title:</label>
              <input type="text" id="lms-title" class="lms-title-input" value="Whiteboard Recording">
            </div>
            <div class="form-group">
              <label for="lms-description">Description:</label>
              <textarea id="lms-description" class="lms-description-input">Whiteboard recording from our session.</textarea>
            </div>
            <div class="form-group">
              <label>Visibility:</label>
              <div class="radio-group">
                <label><input type="radio" name="visibility" value="visible" checked> Visible to students</label>
                <label><input type="radio" name="visibility" value="hidden"> Hidden from students</label>
              </div>
            </div>
          </div>
          <div class="lms-share-modal-footer">
            <button class="cancel-share-btn">Cancel</button>
            <button class="confirm-share-btn">Share to <span class="lms-name"></span></button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);

      // Add event listeners
      modal.querySelector('.close-modal-btn').addEventListener('click', () => {
        modal.classList.remove('visible');
      });

      modal.querySelector('.cancel-share-btn').addEventListener('click', () => {
        modal.classList.remove('visible');
      });

      modal.querySelector('.confirm-share-btn').addEventListener('click', () => {
        // Simulate sharing process
        const courseId = modal.querySelector('.lms-course-select').value;
        const moduleId = modal.querySelector('.lms-module-select').value;
        const title = modal.querySelector('.lms-title-input').value;

        modal.classList.remove('visible');

        this.showNotification('Shared successfully', `Recording shared to ${lms.name} in course "${courseId}" as "${title}".`);
      });
    }

    // Update LMS name in modal
    const lmsNameElements = modal.querySelectorAll('.lms-name');
    lmsNameElements.forEach(el => {
      el.textContent = lms.name;
    });

    // Show the modal
    modal.classList.add('visible');
  }

  /**
   * Render exports in the UI
   */
  renderExports() {
    const exportsContainer = document.querySelector('.exports-list');
    if (!exportsContainer) return;

    if (this.exports.length === 0) {
      exportsContainer.innerHTML = `
        <div class="empty-state">
          <p>No exports yet. Choose a format and export your recording.</p>
        </div>
      `;
      return;
    }

    let html = '';

    // Sort exports by requested time (newest first)
    const sortedExports = [...this.exports].sort((a, b) =>
      new Date(b.requestedAt) - new Date(a.requestedAt)
    );

    sortedExports.forEach(exportItem => {
      const format = this.exportFormats.find(f => f.id === exportItem.format) ||
        { name: exportItem.format, description: '' };

      const date = new Date(exportItem.requestedAt);
      const formattedDate = date.toLocaleDateString() + ' ' +
        date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      html += `
        <div class="export-item">
          <div class="export-header">
            <div class="export-format">${format.name}</div>
            <div class="export-date">${formattedDate}</div>
          </div>
          <div class="export-description">${format.description}</div>
      `;

      // Status-specific content
      if (exportItem.status === 'processing') {
        html += `
          <div class="export-progress">
            <div class="progress-bar">
              <div class="progress-bar-fill" style="width: ${exportItem.progress || 0}%"></div>
            </div>
            <div class="progress-text">Processing: ${exportItem.progress || 0}%</div>
          </div>
        `;
      } else if (exportItem.status === 'completed') {
        html += `
          <div class="export-actions">
            <a href="${exportItem.url}" class="download-export-btn" download>
              <i class="fas fa-download"></i> Download
            </a>
            <button class="share-export-btn" data-export-id="${exportItem.id}">
              <i class="fas fa-share"></i> Share
            </button>
          </div>
        `;
      } else if (exportItem.status === 'failed') {
        html += `
          <div class="export-error">
            <i class="fas fa-exclamation-circle"></i> Export failed. Please try again.
          </div>
          <div class="export-actions">
            <button class="retry-export-btn" data-format="${exportItem.format}">
              <i class="fas fa-redo"></i> Retry
            </button>
          </div>
        `;
      }

      html += `</div>`;
    });

    exportsContainer.innerHTML = html;

    // Add event listeners for retry buttons
    const retryButtons = exportsContainer.querySelectorAll('.retry-export-btn');
    retryButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const format = btn.dataset.format;
        this.requestExport(this.currentWhiteboardId, this.currentRecordingId, format);
      });
    });
  }

  /**
   * Update export settings
   * @param {Object} settings - Export settings
   */
  updateExportSettings(settings) {
    // This method would update UI based on selected format
    // For example, showing different options for different formats

    if (settings.format) {
      const formatDetails = this.exportFormats.find(f => f.id === settings.format);
      if (formatDetails) {
        const descriptionEl = document.querySelector('.format-description');
        if (descriptionEl) {
          descriptionEl.textContent = formatDetails.description;
        }

        // Show/hide format-specific options
        this.toggleFormatOptions(settings.format);
      }
    }
  }

  /**
   * Toggle format-specific export options
   * @param {String} format - Export format
   */
  toggleFormatOptions(format) {
    // Show/hide options based on format
    const qualityOption = document.querySelector('.quality-option');
    const annotationsOption = document.querySelector('.annotations-option');
    const chatOption = document.querySelector('.chat-option');

    if (qualityOption) {
      qualityOption.style.display = ['mp4', 'png-sequence'].includes(format) ? 'block' : 'none';
    }

    if (annotationsOption) {
      annotationsOption.style.display = ['pdf', 'html'].includes(format) ? 'block' : 'none';
    }

    if (chatOption) {
      chatOption.style.display = ['pdf', 'html'].includes(format) ? 'block' : 'none';
    }
  }

  /**
   * Format time in milliseconds to MM:SS format
   * @param {Number} timeMs - Time in milliseconds
   * @returns {String} Formatted time
   */
  formatTime(timeMs) {
    const totalSeconds = Math.floor(timeMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
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
window.WhiteboardRecordingExportEnhanced = WhiteboardRecordingExportEnhanced;
