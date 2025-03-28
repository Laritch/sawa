/**
 * WhiteboardRecordingExporter
 * Handles export of whiteboard recordings in different formats
 */
class WhiteboardRecordingExporter {
  constructor(options = {}) {
    this.whiteboardManager = options.whiteboardManager;
    this.webinarId = options.webinarId;
    this.isHost = options.isHost || false;
    this.isPresenter = options.isPresenter || false;

    this.exports = [];
    this.initialize();
  }

  /**
   * Initialize exporter
   */
  initialize() {
    this.setupSocketListeners();
  }

  /**
   * Setup socket listeners
   */
  setupSocketListeners() {
    if (!this.whiteboardManager.socket) return;

    // Listen for export status updates
    this.whiteboardManager.socket.on('recording:export:completed', (data) => {
      this.showNotification('Export completed', 'Your recording has been exported and is ready for download.');

      // Update export status in list
      this.updateExportStatus(data.whiteboardId, data.recordingId, data.exportId, {
        status: 'completed',
        url: data.url
      });
    });
  }

  /**
   * Request export of a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {String} format - Export format (json, video, png-sequence)
   */
  requestExport(whiteboardId, recordingId, format) {
    if (!whiteboardId || !recordingId) {
      console.error('Whiteboard ID and Recording ID are required');
      return;
    }

    // Check if user can export
    if (!this.isHost && !this.isPresenter) {
      this.showNotification('Permission denied', 'Only hosts and presenters can export recordings.', 'error');
      return;
    }

    // Validate format
    if (!['json', 'video', 'png-sequence'].includes(format)) {
      console.error('Invalid export format');
      return;
    }

    // Make API call to request export
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/request-export`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ format })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showNotification('Export request received', `Your ${format} export is being processed.`, 'info');

        // Add to local exports list
        this.addExport(whiteboardId, recordingId, {
          _id: data.exportId,
          format,
          status: 'pending',
          requestedAt: new Date()
        });
      } else {
        this.showNotification('Export failed', data.message, 'error');
      }
    })
    .catch(error => {
      console.error('Error requesting export:', error);
      this.showNotification('Export failed', 'An error occurred while requesting the export.', 'error');
    });
  }

  /**
   * Add export to list
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {Object} exportData - Export data
   */
  addExport(whiteboardId, recordingId, exportData) {
    // Add to local exports array
    this.exports.push({
      whiteboardId,
      recordingId,
      ...exportData
    });

    // Refresh UI if it exists
    this.renderExportsUI(whiteboardId, recordingId);
  }

  /**
   * Update export status
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {String} exportId - Export ID
   * @param {Object} statusData - Status data to update
   */
  updateExportStatus(whiteboardId, recordingId, exportId, statusData) {
    // Find and update export
    const exportIndex = this.exports.findIndex(exp =>
      exp._id === exportId &&
      exp.whiteboardId === whiteboardId &&
      exp.recordingId === recordingId
    );

    if (exportIndex !== -1) {
      this.exports[exportIndex] = {
        ...this.exports[exportIndex],
        ...statusData
      };

      // Refresh UI if it exists
      this.renderExportsUI(whiteboardId, recordingId);
    }
  }

  /**
   * Load exports for a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  loadExports(whiteboardId, recordingId) {
    if (!whiteboardId || !recordingId) {
      console.error('Whiteboard ID and Recording ID are required');
      return;
    }

    // Make API call to get exports
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/exports`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.exports) {
        // Update local exports array
        this.exports = this.exports.filter(exp =>
          exp.whiteboardId !== whiteboardId || exp.recordingId !== recordingId
        );

        data.exports.forEach(exp => {
          this.exports.push({
            whiteboardId,
            recordingId,
            ...exp
          });
        });

        // Refresh UI
        this.renderExportsUI(whiteboardId, recordingId);
      }
    })
    .catch(error => {
      console.error('Error loading exports:', error);
    });
  }

  /**
   * Create export UI
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {Element} container - Container to render in
   */
  createExportsUI(whiteboardId, recordingId, container) {
    if (!container) return;

    // Create exports container
    const exportsContainer = document.createElement('div');
    exportsContainer.className = 'export-options';
    exportsContainer.id = `exports-container-${recordingId}`;

    exportsContainer.innerHTML = `
      <div class="export-options-header">
        Export Recording
      </div>
      <div class="export-option" data-format="json">
        <div class="export-option-icon json">
          <i class="fas fa-file-code"></i>
        </div>
        <div class="export-option-details">
          <div class="export-option-title">JSON Format</div>
          <div class="export-option-description">Export raw recording data as JSON for backup or processing</div>
        </div>
      </div>
      <div class="export-option" data-format="video">
        <div class="export-option-icon video">
          <i class="fas fa-video"></i>
        </div>
        <div class="export-option-details">
          <div class="export-option-title">Video Format</div>
          <div class="export-option-description">Export as MP4 video for easy sharing and playback</div>
        </div>
      </div>
      <div class="export-option" data-format="png-sequence">
        <div class="export-option-icon images">
          <i class="fas fa-images"></i>
        </div>
        <div class="export-option-details">
          <div class="export-option-title">PNG Sequence</div>
          <div class="export-option-description">Export as sequence of PNG images for frame-by-frame analysis</div>
        </div>
      </div>
    `;

    // Add click listeners for export options
    exportsContainer.querySelectorAll('.export-option').forEach(option => {
      option.addEventListener('click', () => {
        const format = option.dataset.format;
        this.requestExport(whiteboardId, recordingId, format);
      });
    });

    // Render container
    container.appendChild(exportsContainer);

    // Load existing exports
    this.loadExports(whiteboardId, recordingId);
  }

  /**
   * Render exports UI
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  renderExportsUI(whiteboardId, recordingId) {
    const container = document.getElementById(`exports-container-${recordingId}`);
    if (!container) return;

    // Filter exports for this recording
    const recordingExports = this.exports.filter(exp =>
      exp.whiteboardId === whiteboardId && exp.recordingId === recordingId
    );

    // Update UI with export status
    container.querySelectorAll('.export-option').forEach(option => {
      const format = option.dataset.format;
      const formatExport = recordingExports.find(exp => exp.format === format);

      // Remove existing status elements
      option.querySelectorAll('.export-status').forEach(el => el.remove());

      if (formatExport) {
        // Add status badge
        const statusEl = document.createElement('div');
        statusEl.className = `export-status ${formatExport.status}`;
        statusEl.textContent = formatExport.status.charAt(0).toUpperCase() + formatExport.status.slice(1);
        option.appendChild(statusEl);

        // If completed, make clickable to download
        if (formatExport.status === 'completed' && formatExport.url) {
          option.style.cursor = 'pointer';
          option.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent triggering the regular click handler
            window.open(formatExport.url, '_blank');
          });
        }
      }
    });
  }

  /**
   * Show notification toast
   * @param {String} title - Notification title
   * @param {String} message - Notification message
   * @param {String} type - Notification type (success, error, info, warning)
   */
  showNotification(title, message, type = 'success') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification-toast ${type}`;
    notification.innerHTML = `
      <div style="font-weight: bold;">${title}</div>
      <div>${message}</div>
    `;

    // Add to document
    document.body.appendChild(notification);

    // Show notification (after a small delay to allow CSS transition)
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remove after timeout
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => document.body.removeChild(notification), 300);
    }, 5000);
  }
}
