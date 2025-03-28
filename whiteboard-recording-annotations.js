/**
 * WhiteboardRecordingAnnotations
 * Handles annotations for whiteboard recordings
 */
class WhiteboardRecordingAnnotations {
  constructor(options = {}) {
    this.whiteboardManager = options.whiteboardManager;
    this.webinarId = options.webinarId;
    this.userId = options.userId;
    this.socket = options.socket;

    this.annotations = [];
    this.currentPlayingTime = 0;
    this.player = null;
    this.searchQuery = '';

    this.initialize();
  }

  /**
   * Initialize annotations manager
   */
  initialize() {
    this.setupSocketListeners();
  }

  /**
   * Setup socket listeners for annotation events
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Listen for new annotations
    this.socket.on('recording:annotation:added', (data) => {
      // Add to local annotations array if for current recording
      if (this.currentRecordingId === data.recordingId) {
        this.annotations.push(data.annotation);

        // Sort annotations by timestamp
        this.sortAnnotations();

        // Update UI
        this.renderAnnotations();

        // Show notification
        this.showNotification('New annotation added', 'A new annotation has been added to this recording.');
      }
    });
  }

  /**
   * Sort annotations by timestamp
   */
  sortAnnotations() {
    this.annotations.sort((a, b) => a.timestamp - b.timestamp);
  }

  /**
   * Set the recording player reference and current recording
   * @param {Object} player - Recording player reference
   * @param {String} whiteboardId - Current whiteboard ID
   * @param {String} recordingId - Current recording ID
   */
  setPlayer(player, whiteboardId, recordingId) {
    this.player = player;
    this.currentWhiteboardId = whiteboardId;
    this.currentRecordingId = recordingId;

    // Load annotations for this recording
    this.loadAnnotations(whiteboardId, recordingId);
  }

  /**
   * Update current playback time
   * @param {Number} time - Current playback time in milliseconds
   */
  updatePlaybackTime(time) {
    this.currentPlayingTime = time;

    // Update current time in annotation form if it exists
    const currentTimeEl = document.querySelector('.add-annotation-form .current-time');
    if (currentTimeEl) {
      currentTimeEl.textContent = this.formatTime(time);
    }

    // Highlight current annotations
    this.highlightCurrentAnnotations();
  }

  /**
   * Highlight annotations for current time
   */
  highlightCurrentAnnotations() {
    const annotationItems = document.querySelectorAll('.annotation-item');

    annotationItems.forEach(item => {
      // Remove highlight
      item.style.backgroundColor = '';

      // Check if annotation timestamp is within 2 seconds of current time
      const timestamp = parseInt(item.dataset.timestamp);
      if (Math.abs(timestamp - this.currentPlayingTime) < 2000) {
        item.style.backgroundColor = '#f0f7ff';
      }
    });
  }

  /**
   * Load annotations for a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  loadAnnotations(whiteboardId, recordingId) {
    if (!whiteboardId || !recordingId) return;

    // Clear current annotations
    this.annotations = [];

    // Make API call to load annotations
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/annotations`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.annotations) {
        this.annotations = data.annotations;
        this.sortAnnotations();
        this.renderAnnotations();
      }
    })
    .catch(error => {
      console.error('Error loading annotations:', error);
    });
  }

  /**
   * Add an annotation to the recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {String} text - Annotation text
   * @param {Number} timestamp - Annotation timestamp (defaults to current playing time)
   */
  addAnnotation(whiteboardId, recordingId, text, timestamp = null) {
    if (!whiteboardId || !recordingId || !text) return;

    // Use provided timestamp or current playing time
    const annotationTime = timestamp !== null ? timestamp : this.currentPlayingTime;

    // Make API call to add annotation
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/annotations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text,
        timestamp: annotationTime
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.annotation) {
        // Add to local array
        this.annotations.push(data.annotation);
        this.sortAnnotations();

        // Update UI
        this.renderAnnotations();

        // Clear form
        const textArea = document.querySelector('.add-annotation-form textarea');
        if (textArea) {
          textArea.value = '';
        }

        // Show success notification
        this.showNotification('Annotation added', 'Your annotation has been added successfully.');
      } else {
        this.showNotification('Failed to add annotation', data.message || 'An error occurred', 'error');
      }
    })
    .catch(error => {
      console.error('Error adding annotation:', error);
      this.showNotification('Failed to add annotation', 'An error occurred while adding the annotation', 'error');
    });
  }

  /**
   * Create annotations UI in container
   * @param {Element} container - Container to create UI in
   */
  createAnnotationsUI(container) {
    if (!container) return;

    // Create annotations list
    const annotationsContainer = document.createElement('div');
    annotationsContainer.className = 'annotations-container';

    // Add search bar
    const searchBar = document.createElement('div');
    searchBar.className = 'annotation-search-bar';
    searchBar.innerHTML = `
      <input type="text" class="annotation-search-input" placeholder="Search annotations...">
      <button class="annotation-search-button">
        <i class="fas fa-search"></i>
      </button>
    `;

    // Add annotation form
    const annotationForm = document.createElement('div');
    annotationForm.className = 'add-annotation-form';
    annotationForm.innerHTML = `
      <textarea placeholder="Add a note or comment about this point in the recording..."></textarea>
      <div class="form-footer">
        <div class="current-time">${this.formatTime(this.currentPlayingTime)}</div>
        <button type="button">Add Annotation</button>
      </div>
    `;

    // Add event listener for form submission
    annotationForm.querySelector('button').addEventListener('click', () => {
      const text = annotationForm.querySelector('textarea').value.trim();
      if (text) {
        this.addAnnotation(this.currentWhiteboardId, this.currentRecordingId, text);
      }
    });

    // Add event listener for search
    searchBar.querySelector('.annotation-search-button').addEventListener('click', () => {
      const searchInput = searchBar.querySelector('.annotation-search-input');
      this.searchAnnotations(searchInput.value);
    });

    // Search on Enter key
    searchBar.querySelector('.annotation-search-input').addEventListener('keyup', (e) => {
      if (e.key === 'Enter') {
        this.searchAnnotations(e.target.value);
      }

      // Clear search when input is cleared
      if (e.target.value === '') {
        this.clearSearch();
      }
    });

    // Annotations list
    const annotationsList = document.createElement('div');
    annotationsList.className = 'annotations-list';
    annotationsList.id = 'annotations-list';

    // Add components to container
    annotationsContainer.appendChild(searchBar);
    annotationsContainer.appendChild(annotationForm);
    annotationsContainer.appendChild(annotationsList);
    container.appendChild(annotationsContainer);

    // Render annotations
    this.renderAnnotations();
  }

  /**
   * Search annotations by text
   * @param {String} query - Search query
   */
  searchAnnotations(query) {
    if (!query) {
      this.clearSearch();
      return;
    }

    this.searchQuery = query.toLowerCase();

    // Update UI with filtered results
    this.renderAnnotations();

    // Find first matching annotation and highlight
    const highlightedItem = document.querySelector('.annotation-item.highlighted');
    if (highlightedItem) {
      highlightedItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }

  /**
   * Clear search and reset display
   */
  clearSearch() {
    this.searchQuery = '';
    this.renderAnnotations();
  }

  /**
   * Render annotations in the list
   */
  renderAnnotations() {
    const annotationsList = document.getElementById('annotations-list');
    if (!annotationsList) return;

    if (this.annotations.length === 0) {
      annotationsList.innerHTML = '<div class="annotation-item" style="text-align: center; color: #666;">No annotations yet</div>';
      return;
    }

    // Filter annotations if search query is active
    let displayedAnnotations = this.annotations;
    if (this.searchQuery) {
      displayedAnnotations = this.annotations.filter(annotation =>
        annotation.text.toLowerCase().includes(this.searchQuery)
      );

      if (displayedAnnotations.length === 0) {
        annotationsList.innerHTML = `<div class="annotation-item" style="text-align: center; color: #666;">No annotations found matching "${this.searchQuery}"</div>`;
        return;
      }
    }

    annotationsList.innerHTML = displayedAnnotations.map(annotation => {
      const time = this.formatTime(annotation.timestamp);
      let author = 'Unknown';

      // In real implementation, you would look up the username
      if (annotation.author) {
        author = annotation.author === this.userId ? 'You' : `User ${annotation.author.substring(0, 6)}`;
      }

      // Check if this annotation matches the search query
      const matchesSearch = this.searchQuery &&
        annotation.text.toLowerCase().includes(this.searchQuery);

      // Create highlighted HTML for matching text
      let highlightedText = annotation.text;
      if (matchesSearch) {
        const re = new RegExp(`(${this.escapeRegExp(this.searchQuery)})`, 'gi');
        highlightedText = annotation.text.replace(re, '<span class="search-highlight">$1</span>');
      }

      // Add bookmark button
      const bookmarkButton = `
        <button class="annotation-bookmark-btn ${annotation.bookmarked ? 'bookmarked' : ''}"
          title="${annotation.bookmarked ? 'Remove bookmark' : 'Add bookmark'}"
          data-timestamp="${annotation.timestamp}"
          onclick="whiteboardAnnotationManager.toggleBookmark(event, ${annotation.timestamp})">
          <i class="fas ${annotation.bookmarked ? 'fa-bookmark' : 'fa-bookmark'}"></i>
        </button>
      `;

      return `
        <div class="annotation-item ${matchesSearch ? 'highlighted' : ''}" data-timestamp="${annotation.timestamp}">
          <div class="annotation-timestamp" onclick="whiteboardAnnotationManager.seekToTime(${annotation.timestamp})">
            ${time}
          </div>
          <div class="annotation-content">
            ${highlightedText}
            <div class="annotation-author">
              Added by ${author} ${annotation.createdAt ? `on ${new Date(annotation.createdAt).toLocaleString()}` : ''}
            </div>
          </div>
          <div class="annotation-actions">
            ${bookmarkButton}
            <button class="annotation-reply-btn" title="Reply"
              onclick="whiteboardAnnotationManager.showReplyForm(event, ${annotation.timestamp})">
              <i class="fas fa-reply"></i>
            </button>
          </div>
        </div>
        ${annotation.replies && annotation.replies.length > 0 ?
          `<div class="annotation-replies">
            ${annotation.replies.map(reply => `
              <div class="annotation-reply">
                <div class="reply-content">
                  ${reply.text}
                  <div class="annotation-author">
                    Reply by ${reply.author === this.userId ? 'You' : `User ${reply.author.substring(0, 6)}`}
                    ${reply.createdAt ? `on ${new Date(reply.createdAt).toLocaleString()}` : ''}
                  </div>
                </div>
              </div>
            `).join('')}
          </div>` : ''
        }
        <div class="annotation-reply-form" id="reply-form-${annotation.timestamp}" style="display: none;">
          <textarea placeholder="Add a reply..."></textarea>
          <div class="reply-form-footer">
            <button type="button" onclick="whiteboardAnnotationManager.addReply(${annotation.timestamp})">Reply</button>
            <button type="button" class="cancel-btn" onclick="whiteboardAnnotationManager.hideReplyForm(${annotation.timestamp})">Cancel</button>
          </div>
        </div>
      `;
    }).join('');

    // Highlight any current annotations
    this.highlightCurrentAnnotations();
  }

  /**
   * Escape special characters for regex
   * @param {String} string - String to escape
   * @returns {String} - Escaped string
   */
  escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Toggle bookmark for an annotation
   * @param {Event} event - Click event
   * @param {Number} timestamp - Annotation timestamp
   */
  toggleBookmark(event, timestamp) {
    event.stopPropagation();

    // Find annotation
    const annotationIndex = this.annotations.findIndex(a => a.timestamp === timestamp);
    if (annotationIndex === -1) return;

    // Toggle bookmark
    this.annotations[annotationIndex].bookmarked = !this.annotations[annotationIndex].bookmarked;

    // Update UI
    const button = event.currentTarget;
    if (this.annotations[annotationIndex].bookmarked) {
      button.classList.add('bookmarked');
      button.title = 'Remove bookmark';
    } else {
      button.classList.remove('bookmarked');
      button.title = 'Add bookmark';
    }

    // Save bookmark to server
    this.updateAnnotation(
      this.currentWhiteboardId,
      this.currentRecordingId,
      timestamp,
      { bookmarked: this.annotations[annotationIndex].bookmarked }
    );
  }

  /**
   * Update an annotation
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {Number} timestamp - Annotation timestamp
   * @param {Object} updateData - Data to update
   */
  updateAnnotation(whiteboardId, recordingId, timestamp, updateData) {
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/annotations/${timestamp}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updateData)
    })
    .then(response => response.json())
    .then(data => {
      if (!data.success) {
        console.error('Failed to update annotation:', data.message);
      }
    })
    .catch(error => {
      console.error('Error updating annotation:', error);
    });
  }

  /**
   * Show reply form for an annotation
   * @param {Event} event - Click event
   * @param {Number} timestamp - Annotation timestamp
   */
  showReplyForm(event, timestamp) {
    event.stopPropagation();

    // Hide any other open reply forms
    document.querySelectorAll('.annotation-reply-form').forEach(form => {
      form.style.display = 'none';
    });

    // Show this reply form
    const replyForm = document.getElementById(`reply-form-${timestamp}`);
    if (replyForm) {
      replyForm.style.display = 'block';
      replyForm.querySelector('textarea').focus();
    }
  }

  /**
   * Hide reply form
   * @param {Number} timestamp - Annotation timestamp
   */
  hideReplyForm(timestamp) {
    const replyForm = document.getElementById(`reply-form-${timestamp}`);
    if (replyForm) {
      replyForm.style.display = 'none';
    }
  }

  /**
   * Add reply to an annotation
   * @param {Number} timestamp - Annotation timestamp
   */
  addReply(timestamp) {
    const replyForm = document.getElementById(`reply-form-${timestamp}`);
    if (!replyForm) return;

    const replyText = replyForm.querySelector('textarea').value.trim();
    if (!replyText) return;

    // Find annotation
    const annotationIndex = this.annotations.findIndex(a => a.timestamp === timestamp);
    if (annotationIndex === -1) return;

    // Initialize replies array if it doesn't exist
    if (!this.annotations[annotationIndex].replies) {
      this.annotations[annotationIndex].replies = [];
    }

    // Add reply
    const reply = {
      text: replyText,
      author: this.userId,
      createdAt: new Date()
    };

    this.annotations[annotationIndex].replies.push(reply);

    // Update UI
    this.renderAnnotations();

    // Hide reply form
    this.hideReplyForm(timestamp);

    // Save reply to server
    this.addAnnotationReply(
      this.currentWhiteboardId,
      this.currentRecordingId,
      timestamp,
      reply
    );
  }

  /**
   * Add a reply to an annotation on the server
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   * @param {Number} timestamp - Annotation timestamp
   * @param {Object} reply - Reply data
   */
  addAnnotationReply(whiteboardId, recordingId, timestamp, reply) {
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/annotations/${timestamp}/replies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(reply)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Emit socket event for real-time collaboration
        if (this.socket) {
          this.socket.emit('recording:annotation:reply:added', {
            webinarId: this.webinarId,
            whiteboardId: whiteboardId,
            recordingId: recordingId,
            timestamp: timestamp,
            reply: reply
          });
        }
      } else {
        console.error('Failed to add reply:', data.message);
      }
    })
    .catch(error => {
      console.error('Error adding reply:', error);
    });
  }

  /**
   * Get all bookmarked annotations
   * @returns {Array} - Bookmarked annotations
   */
  getBookmarks() {
    return this.annotations.filter(a => a.bookmarked);
  }

  /**
   * Format time (milliseconds) to HH:MM:SS
   * @param {Number} ms - Time in milliseconds
   * @returns {String} - Formatted time string
   */
  formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return [hours, minutes, seconds]
      .map(v => v.toString().padStart(2, '0'))
      .join(':');
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

    // Show notification
    setTimeout(() => {
      notification.classList.add('show');
    }, 10);

    // Remove after timeout
    setTimeout(() => {
      notification.classList.remove('show');
      setTimeout(() => {
        if (document.body.contains(notification)) {
          document.body.removeChild(notification);
        }
      }, 300);
    }, 5000);
  }
}
