/**
 * WhiteboardRecordingCollaboration
 * Provides advanced collaboration features for whiteboard recordings
 */
class WhiteboardRecordingCollaboration {
  constructor(options = {}) {
    this.whiteboardManager = options.whiteboardManager;
    this.webinarId = options.webinarId;
    this.userId = options.userId;
    this.socket = options.socket;

    this.currentRecordingId = null;
    this.currentWhiteboardId = null;
    this.player = null;
    this.activeCollaborators = [];
    this.breakoutRooms = [];
    this.voiceNotes = [];
    this.audioRecorder = null;
    this.isRecordingVoiceNote = false;
    this.audioChunks = [];

    this.initialize();
  }

  /**
   * Initialize collaboration features
   */
  initialize() {
    this.setupEventListeners();
    this.setupSocketListeners();
    this.setupAudioCapture();
  }

  /**
   * Setup socket listeners for collaboration events
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Listen for collaborator joined event
    this.socket.on('recording:collaborator:joined', (data) => {
      if (this.currentRecordingId === data.recordingId) {
        this.activeCollaborators.push(data.user);
        this.renderCollaborators();
        this.showNotification('Collaborator joined', `${data.user.name} joined the recording session.`);
      }
    });

    // Listen for collaborator left event
    this.socket.on('recording:collaborator:left', (data) => {
      if (this.currentRecordingId === data.recordingId) {
        this.activeCollaborators = this.activeCollaborators.filter(user => user.id !== data.userId);
        this.renderCollaborators();
      }
    });

    // Listen for new voice note event
    this.socket.on('recording:voicenote:added', (data) => {
      if (this.currentRecordingId === data.recordingId) {
        this.voiceNotes.push(data.voiceNote);
        this.renderVoiceNotes();
        this.showNotification('New voice note', `${data.user.name} added a voice note.`);
      }
    });

    // Listen for breakout room created event
    this.socket.on('recording:breakoutroom:created', (data) => {
      if (this.currentRecordingId === data.recordingId) {
        this.breakoutRooms.push(data.breakoutRoom);
        this.renderBreakoutRooms();
        this.showNotification('Breakout room created', `A new breakout room "${data.breakoutRoom.name}" was created.`);
      }
    });
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    document.addEventListener('click', (event) => {
      // Handle voice note recording buttons
      if (event.target.closest('.start-voice-note-btn')) {
        this.startVoiceNoteRecording();
      }

      if (event.target.closest('.stop-voice-note-btn')) {
        this.stopVoiceNoteRecording();
      }

      if (event.target.closest('.cancel-voice-note-btn')) {
        this.cancelVoiceNoteRecording();
      }

      // Handle create breakout room button
      if (event.target.closest('.create-breakout-room-btn')) {
        this.showCreateBreakoutRoomModal();
      }

      // Handle join breakout room button
      if (event.target.closest('.join-breakout-room-btn')) {
        const roomId = event.target.closest('.join-breakout-room-btn').dataset.roomId;
        this.joinBreakoutRoom(roomId);
      }
    });
  }

  /**
   * Setup audio capture capabilities
   */
  setupAudioCapture() {
    // Check if browser supports audio recording
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      console.warn('Browser does not support audio recording');
      return;
    }
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

    // Join collaboration session
    this.joinCollaborationSession(whiteboardId, recordingId);

    // Load voice notes
    this.loadVoiceNotes(whiteboardId, recordingId);

    // Load breakout rooms
    this.loadBreakoutRooms(whiteboardId, recordingId);
  }

  /**
   * Join collaboration session for a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  joinCollaborationSession(whiteboardId, recordingId) {
    if (!whiteboardId || !recordingId || !this.socket) return;

    this.socket.emit('recording:collaborator:join', {
      webinarId: this.webinarId,
      whiteboardId: whiteboardId,
      recordingId: recordingId,
      userId: this.userId
    });

    // Get current active collaborators
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/collaborators`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.activeCollaborators = data.collaborators || [];
        this.renderCollaborators();
      }
    })
    .catch(error => {
      console.error('Error loading collaborators:', error);
    });
  }

  /**
   * Load voice notes for a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  loadVoiceNotes(whiteboardId, recordingId) {
    if (!whiteboardId || !recordingId) return;

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/voicenotes`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.voiceNotes = data.voiceNotes || [];
        this.renderVoiceNotes();
      }
    })
    .catch(error => {
      console.error('Error loading voice notes:', error);
    });
  }

  /**
   * Load breakout rooms for a recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  loadBreakoutRooms(whiteboardId, recordingId) {
    if (!whiteboardId || !recordingId) return;

    fetch(`/api/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}/breakoutrooms`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.breakoutRooms = data.breakoutRooms || [];
        this.renderBreakoutRooms();
      }
    })
    .catch(error => {
      console.error('Error loading breakout rooms:', error);
    });
  }

  /**
   * Render active collaborators in the UI
   */
  renderCollaborators() {
    const collaboratorsContainer = document.querySelector('.active-collaborators');
    if (!collaboratorsContainer) return;

    if (this.activeCollaborators.length === 0) {
      collaboratorsContainer.innerHTML = `
        <div class="empty-state">
          <p>No active collaborators</p>
        </div>
      `;
      return;
    }

    let html = '<div class="collaborators-list">';

    this.activeCollaborators.forEach(user => {
      html += `
        <div class="collaborator-item">
          <div class="collaborator-avatar">
            <img src="${user.avatar || '/uploads/default-avatar.png'}" alt="${user.name}">
            <span class="collaborator-status ${user.status}"></span>
          </div>
          <div class="collaborator-info">
            <div class="collaborator-name">${user.name}</div>
            <div class="collaborator-role">${user.role || 'Participant'}</div>
          </div>
        </div>
      `;
    });

    html += '</div>';
    collaboratorsContainer.innerHTML = html;
  }

  /**
   * Render voice notes in the UI
   */
  renderVoiceNotes() {
    const voiceNotesContainer = document.querySelector('.voice-notes-list');
    if (!voiceNotesContainer) return;

    if (this.voiceNotes.length === 0) {
      voiceNotesContainer.innerHTML = `
        <div class="empty-state">
          <p>No voice notes added</p>
          <button class="start-voice-note-btn">
            <i class="fas fa-microphone"></i> Add Voice Note
          </button>
        </div>
      `;
      return;
    }

    let html = '';

    this.voiceNotes.forEach(note => {
      const date = new Date(note.timestamp);
      const formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      html += `
        <div class="voice-note-item" data-id="${note.id}">
          <div class="voice-note-header">
            <div class="voice-note-info">
              <span class="voice-note-author">${note.author.name}</span>
              <span class="voice-note-time">${formattedTime}</span>
            </div>
            <div class="voice-note-timestamp" data-timestamp="${note.recordingTimestamp}">
              ${this.formatTime(note.recordingTimestamp)}
            </div>
          </div>
          <div class="voice-note-player">
            <audio src="${note.audioUrl}" controls preload="metadata"></audio>
          </div>
          <div class="voice-note-actions">
            <button class="voice-note-jump-btn" data-timestamp="${note.recordingTimestamp}">
              <i class="fas fa-play"></i> Jump to Timestamp
            </button>
          </div>
        </div>
      `;
    });

    // Add button to record new voice note
    html += `
      <div class="voice-note-add">
        <button class="start-voice-note-btn">
          <i class="fas fa-microphone"></i> Add Voice Note
        </button>
      </div>
    `;

    voiceNotesContainer.innerHTML = html;

    // Add event listeners for jump buttons
    const jumpButtons = voiceNotesContainer.querySelectorAll('.voice-note-jump-btn');
    jumpButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const timestamp = parseInt(btn.dataset.timestamp);
        if (this.player && timestamp) {
          this.player.seekToTime(timestamp);
        }
      });
    });
  }

  /**
   * Render breakout rooms in the UI
   */
  renderBreakoutRooms() {
    const breakoutRoomsContainer = document.querySelector('.breakout-rooms-list');
    if (!breakoutRoomsContainer) return;

    if (this.breakoutRooms.length === 0) {
      breakoutRoomsContainer.innerHTML = `
        <div class="empty-state">
          <p>No breakout rooms available</p>
          <button class="create-breakout-room-btn">
            <i class="fas fa-plus"></i> Create Breakout Room
          </button>
        </div>
      `;
      return;
    }

    let html = '';

    this.breakoutRooms.forEach(room => {
      const participantCount = room.participants ? room.participants.length : 0;

      html += `
        <div class="breakout-room-item" data-id="${room.id}">
          <div class="breakout-room-header">
            <div class="breakout-room-name">${room.name}</div>
            <div class="breakout-room-participants">
              <i class="fas fa-users"></i> ${participantCount}
            </div>
          </div>
          <div class="breakout-room-description">${room.description || 'No description'}</div>
          <div class="breakout-room-actions">
            <button class="join-breakout-room-btn" data-room-id="${room.id}">
              <i class="fas fa-sign-in-alt"></i> Join Room
            </button>
          </div>
        </div>
      `;
    });

    // Add button to create new breakout room
    html += `
      <div class="breakout-room-add">
        <button class="create-breakout-room-btn">
          <i class="fas fa-plus"></i> Create Breakout Room
        </button>
      </div>
    `;

    breakoutRoomsContainer.innerHTML = html;
  }

  /**
   * Start recording a voice note
   */
  startVoiceNoteRecording() {
    if (this.isRecordingVoiceNote) return;

    // Show recording UI
    const voiceNoteRecorder = document.querySelector('.voice-note-recorder') || this.createVoiceNoteRecorderUI();
    voiceNoteRecorder.style.display = 'block';

    // Request microphone access
    navigator.mediaDevices.getUserMedia({ audio: true })
      .then(stream => {
        this.audioRecorder = new MediaRecorder(stream);
        this.audioChunks = [];

        this.audioRecorder.addEventListener('dataavailable', e => {
          this.audioChunks.push(e.data);
        });

        this.audioRecorder.addEventListener('stop', () => {
          // Only process if not cancelled
          if (this.isRecordingVoiceNote) {
            this.processVoiceNote();
          }

          // Release microphone
          stream.getTracks().forEach(track => track.stop());
        });

        // Start recording
        this.audioRecorder.start();
        this.isRecordingVoiceNote = true;

        // Update UI to show recording in progress
        const recordButton = document.querySelector('.start-voice-note-btn');
        if (recordButton) {
          recordButton.style.display = 'none';
        }

        const recorderStatus = document.querySelector('.voice-note-recorder-status');
        if (recorderStatus) {
          recorderStatus.textContent = 'Recording...';
        }

        // Start recording timer
        this.startRecordingTimer();
      })
      .catch(error => {
        console.error('Error accessing microphone:', error);
        this.showNotification('Microphone Access Error', 'Could not access your microphone. Please check permissions.');
      });
  }

  /**
   * Stop recording a voice note
   */
  stopVoiceNoteRecording() {
    if (!this.isRecordingVoiceNote || !this.audioRecorder) return;

    // Stop the recorder
    this.audioRecorder.stop();

    // Stop the timer
    this.stopRecordingTimer();

    // Update UI
    const recorderStatus = document.querySelector('.voice-note-recorder-status');
    if (recorderStatus) {
      recorderStatus.textContent = 'Processing...';
    }
  }

  /**
   * Cancel voice note recording
   */
  cancelVoiceNoteRecording() {
    if (this.audioRecorder && this.isRecordingVoiceNote) {
      // Stop the recorder
      this.audioRecorder.stop();

      // Stop the timer
      this.stopRecordingTimer();
    }

    // Reset state
    this.isRecordingVoiceNote = false;
    this.audioChunks = [];

    // Hide recorder UI
    const voiceNoteRecorder = document.querySelector('.voice-note-recorder');
    if (voiceNoteRecorder) {
      voiceNoteRecorder.style.display = 'none';
    }

    // Show record button
    const recordButton = document.querySelector('.start-voice-note-btn');
    if (recordButton) {
      recordButton.style.display = 'inline-flex';
    }
  }

  /**
   * Process and save the voice note
   */
  processVoiceNote() {
    // Create audio blob
    const audioBlob = new Blob(this.audioChunks, { type: 'audio/webm' });

    // Get current recording time
    const currentTime = this.player ? this.player.getCurrentTime() : 0;

    // Create form data for upload
    const formData = new FormData();
    formData.append('audio', audioBlob);
    formData.append('webinarId', this.webinarId);
    formData.append('whiteboardId', this.currentWhiteboardId);
    formData.append('recordingId', this.currentRecordingId);
    formData.append('userId', this.userId);
    formData.append('timestamp', currentTime);

    // Send to server
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${this.currentWhiteboardId}/recordings/${this.currentRecordingId}/voicenotes`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: formData
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showNotification('Voice Note Saved', 'Your voice note has been added to the recording.');

        // Add to local list and update UI
        if (data.voiceNote) {
          this.voiceNotes.push(data.voiceNote);
          this.renderVoiceNotes();
        }
      } else {
        this.showNotification('Error', data.message || 'Failed to save voice note.');
      }

      // Reset recording state
      this.isRecordingVoiceNote = false;

      // Hide recorder UI
      const voiceNoteRecorder = document.querySelector('.voice-note-recorder');
      if (voiceNoteRecorder) {
        voiceNoteRecorder.style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Error saving voice note:', error);
      this.showNotification('Error', 'Failed to save voice note.');
      this.isRecordingVoiceNote = false;
    });
  }

  /**
   * Create voice note recorder UI
   * @returns {HTMLElement} The recorder UI element
   */
  createVoiceNoteRecorderUI() {
    const recorderEl = document.createElement('div');
    recorderEl.className = 'voice-note-recorder';
    recorderEl.innerHTML = `
      <div class="voice-note-recorder-status">Ready to record</div>
      <div class="voice-note-recorder-timer">00:00</div>
      <div class="voice-note-recorder-controls">
        <button class="stop-voice-note-btn">
          <i class="fas fa-stop"></i> Stop Recording
        </button>
        <button class="cancel-voice-note-btn">
          <i class="fas fa-times"></i> Cancel
        </button>
      </div>
    `;

    const voiceNotesContainer = document.querySelector('.voice-notes-container');
    if (voiceNotesContainer) {
      voiceNotesContainer.appendChild(recorderEl);
    } else {
      document.body.appendChild(recorderEl);
    }

    return recorderEl;
  }

  /**
   * Start the recording timer
   */
  startRecordingTimer() {
    this.recordingStartTime = Date.now();
    this.recordingTimer = setInterval(() => {
      const elapsedTime = Date.now() - this.recordingStartTime;
      const seconds = Math.floor((elapsedTime / 1000) % 60);
      const minutes = Math.floor((elapsedTime / 1000 / 60) % 60);

      const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

      const timerEl = document.querySelector('.voice-note-recorder-timer');
      if (timerEl) {
        timerEl.textContent = formattedTime;
      }

      // Limit recording to 5 minutes
      if (elapsedTime > 5 * 60 * 1000) {
        this.stopVoiceNoteRecording();
      }
    }, 1000);
  }

  /**
   * Stop the recording timer
   */
  stopRecordingTimer() {
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
      this.recordingTimer = null;
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
window.WhiteboardRecordingCollaboration = WhiteboardRecordingCollaboration;
