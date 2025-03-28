/**
 * WhiteboardRecordingAdminControls
 * Provides comprehensive admin controls for whiteboard recording system
 */
class WhiteboardRecordingAdminControls {
  constructor(options = {}) {
    this.webinarId = options.webinarId;
    this.socket = options.socket;
    this.apiBaseUrl = options.apiBaseUrl || '/api';
    this.adminToken = options.adminToken || localStorage.getItem('adminToken');

    // Current state
    this.webinarState = {
      isActive: false,
      participants: [],
      recordings: [],
      breakoutRooms: [],
      currentSettings: {}
    };

    // Initialize
    this.initialize();
  }

  /**
   * Initialize admin controls
   */
  initialize() {
    this.setupSocketListeners();
    this.setupEventListeners();
    this.loadWebinarState();
  }

  /**
   * Setup socket listeners for real-time admin events
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Listen for participant join events
    this.socket.on('webinar:participant:joined', (data) => {
      this.webinarState.participants.push(data.participant);
      this.renderParticipantsList();
      this.showNotification('Participant joined', `${data.participant.name} joined the webinar`);
    });

    // Listen for participant leave events
    this.socket.on('webinar:participant:left', (data) => {
      this.webinarState.participants = this.webinarState.participants.filter(
        p => p.id !== data.participantId
      );
      this.renderParticipantsList();
    });

    // Listen for recording start/stop events
    this.socket.on('whiteboard:recording:started', (data) => {
      const recording = {
        id: data.recordingId,
        whiteboardId: data.whiteboardId,
        startedAt: new Date().toISOString(),
        status: 'recording'
      };
      this.webinarState.recordings.push(recording);
      this.renderRecordingsList();
      this.showNotification('Recording started', `Recording started on whiteboard ${data.whiteboardId}`);
    });

    this.socket.on('whiteboard:recording:stopped', (data) => {
      const recordingIndex = this.webinarState.recordings.findIndex(
        r => r.id === data.recordingId && r.whiteboardId === data.whiteboardId
      );

      if (recordingIndex !== -1) {
        this.webinarState.recordings[recordingIndex].status = 'completed';
        this.webinarState.recordings[recordingIndex].stoppedAt = new Date().toISOString();
        this.renderRecordingsList();
      }

      this.showNotification('Recording stopped', `Recording stopped on whiteboard ${data.whiteboardId}`);
    });

    // Listen for setting change events
    this.socket.on('webinar:settings:updated', (data) => {
      this.webinarState.currentSettings = data.settings;
      this.renderSettings();
      this.showNotification('Settings updated', 'Webinar settings have been updated');
    });
  }

  /**
   * Setup event listeners for admin control UI
   */
  setupEventListeners() {
    // Webinar control buttons
    document.addEventListener('click', (event) => {
      // Start webinar button
      if (event.target.closest('#start-webinar-btn')) {
        this.startWebinar();
      }

      // End webinar button
      if (event.target.closest('#end-webinar-btn')) {
        this.endWebinar();
      }

      // Start recording button
      if (event.target.closest('#start-recording-btn')) {
        const whiteboardId = document.getElementById('whiteboard-select').value;
        this.startRecording(whiteboardId);
      }

      // Stop recording button
      if (event.target.closest('#stop-recording-btn')) {
        const whiteboardId = document.getElementById('whiteboard-select').value;
        this.stopRecording(whiteboardId);
      }

      // Mute all button
      if (event.target.closest('#mute-all-btn')) {
        this.muteAllParticipants();
      }

      // Create breakout room button
      if (event.target.closest('#create-breakout-btn')) {
        this.createBreakoutRoom();
      }

      // Delete recording button
      if (event.target.closest('.delete-recording-btn')) {
        const recordingId = event.target.closest('.delete-recording-btn').dataset.recordingId;
        const whiteboardId = event.target.closest('.delete-recording-btn').dataset.whiteboardId;
        this.deleteRecording(whiteboardId, recordingId);
      }

      // Ban participant button
      if (event.target.closest('.ban-participant-btn')) {
        const participantId = event.target.closest('.ban-participant-btn').dataset.participantId;
        this.banParticipant(participantId);
      }

      // Save settings button
      if (event.target.closest('#save-settings-btn')) {
        this.saveSettings();
      }
    });
  }

  /**
   * Load current webinar state from API
   */
  loadWebinarState() {
    if (!this.webinarId) {
      console.error('No webinar ID provided');
      return;
    }

    // Fetch webinar data
    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}`, {
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.webinarState = {
          isActive: data.webinar.isActive,
          participants: data.webinar.participants || [],
          recordings: data.webinar.recordings || [],
          breakoutRooms: data.webinar.breakoutRooms || [],
          currentSettings: data.webinar.settings || {}
        };

        // Render UI with loaded data
        this.renderParticipantsList();
        this.renderRecordingsList();
        this.renderBreakoutRoomsList();
        this.renderSettings();
        this.updateWebinarStatus();
      } else {
        console.error('Failed to load webinar data:', data.message);
      }
    })
    .catch(error => {
      console.error('Error loading webinar state:', error);
    });
  }

  /**
   * Render participants list in the UI
   */
  renderParticipantsList() {
    const container = document.getElementById('participants-list');
    if (!container) return;

    if (this.webinarState.participants.length === 0) {
      container.innerHTML = '<div class="empty-state">No participants have joined yet</div>';
      return;
    }

    let html = '';
    this.webinarState.participants.forEach(participant => {
      html += `
        <div class="participant-item">
          <div class="participant-info">
            <div class="participant-name">${participant.name}</div>
            <div class="participant-role">${participant.role || 'Attendee'}</div>
          </div>
          <div class="participant-actions">
            <button class="participant-action-btn mute-participant-btn" data-participant-id="${participant.id}">
              <i class="fas fa-microphone-slash"></i>
            </button>
            <button class="participant-action-btn remove-participant-btn" data-participant-id="${participant.id}">
              <i class="fas fa-sign-out-alt"></i>
            </button>
            <button class="participant-action-btn ban-participant-btn" data-participant-id="${participant.id}">
              <i class="fas fa-ban"></i>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render recordings list in the UI
   */
  renderRecordingsList() {
    const container = document.getElementById('recordings-list');
    if (!container) return;

    if (this.webinarState.recordings.length === 0) {
      container.innerHTML = '<div class="empty-state">No recordings yet</div>';
      return;
    }

    let html = '';
    this.webinarState.recordings.forEach(recording => {
      const startDate = new Date(recording.startedAt);
      const formattedStart = startDate.toLocaleString();

      let duration = 'In progress';
      if (recording.status === 'completed' && recording.stoppedAt) {
        const stopDate = new Date(recording.stoppedAt);
        const durationMs = stopDate - startDate;
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        duration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
      }

      html += `
        <div class="recording-item">
          <div class="recording-info">
            <div class="recording-title">
              Recording on Whiteboard ${recording.whiteboardId}
            </div>
            <div class="recording-meta">
              <span class="recording-date">${formattedStart}</span>
              <span class="recording-duration">${duration}</span>
              <span class="recording-status ${recording.status}">${recording.status}</span>
            </div>
          </div>
          <div class="recording-actions">
            <button class="recording-action-btn view-recording-btn" data-recording-id="${recording.id}" data-whiteboard-id="${recording.whiteboardId}">
              <i class="fas fa-eye"></i>
            </button>
            <button class="recording-action-btn export-recording-btn" data-recording-id="${recording.id}" data-whiteboard-id="${recording.whiteboardId}">
              <i class="fas fa-download"></i>
            </button>
            <button class="recording-action-btn delete-recording-btn" data-recording-id="${recording.id}" data-whiteboard-id="${recording.whiteboardId}">
              <i class="fas fa-trash"></i>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render breakout rooms list in the UI
   */
  renderBreakoutRoomsList() {
    const container = document.getElementById('breakout-rooms-list');
    if (!container) return;

    if (this.webinarState.breakoutRooms.length === 0) {
      container.innerHTML = '<div class="empty-state">No breakout rooms created</div>';
      return;
    }

    let html = '';
    this.webinarState.breakoutRooms.forEach(room => {
      const participantCount = room.participants ? room.participants.length : 0;

      html += `
        <div class="breakout-room-item">
          <div class="breakout-room-info">
            <div class="breakout-room-name">${room.name}</div>
            <div class="breakout-room-participants-count">
              <i class="fas fa-users"></i> ${participantCount} participants
            </div>
          </div>
          <div class="breakout-room-actions">
            <button class="breakout-room-action-btn join-room-btn" data-room-id="${room.id}">
              <i class="fas fa-sign-in-alt"></i>
            </button>
            <button class="breakout-room-action-btn close-room-btn" data-room-id="${room.id}">
              <i class="fas fa-times"></i>
            </button>
          </div>
        </div>
      `;
    });

    container.innerHTML = html;
  }

  /**
   * Render webinar settings in the UI
   */
  renderSettings() {
    // Render chat settings
    if (document.getElementById('chat-enabled')) {
      document.getElementById('chat-enabled').checked = this.webinarState.currentSettings.chatEnabled !== false;
    }

    // Render permissions settings
    if (document.getElementById('allow-recording')) {
      document.getElementById('allow-recording').checked = this.webinarState.currentSettings.allowRecording !== false;
    }

    if (document.getElementById('allow-screen-sharing')) {
      document.getElementById('allow-screen-sharing').checked = this.webinarState.currentSettings.allowScreenSharing !== false;
    }

    if (document.getElementById('allow-annotations')) {
      document.getElementById('allow-annotations').checked = this.webinarState.currentSettings.allowAnnotations !== false;
    }

    // Render quality settings
    if (document.getElementById('video-quality')) {
      document.getElementById('video-quality').value = this.webinarState.currentSettings.videoQuality || 'high';
    }

    // Render security settings
    if (document.getElementById('require-approval')) {
      document.getElementById('require-approval').checked = this.webinarState.currentSettings.requireApproval === true;
    }

    if (document.getElementById('encryption-enabled')) {
      document.getElementById('encryption-enabled').checked = this.webinarState.currentSettings.encryptionEnabled !== false;
    }
  }

  /**
   * Update webinar status indicators in the UI
   */
  updateWebinarStatus() {
    const statusIndicator = document.getElementById('webinar-status');
    if (statusIndicator) {
      statusIndicator.className = this.webinarState.isActive ? 'status-active' : 'status-inactive';
      statusIndicator.textContent = this.webinarState.isActive ? 'Active' : 'Inactive';
    }

    const startBtn = document.getElementById('start-webinar-btn');
    const endBtn = document.getElementById('end-webinar-btn');

    if (startBtn) {
      startBtn.disabled = this.webinarState.isActive;
    }

    if (endBtn) {
      endBtn.disabled = !this.webinarState.isActive;
    }
  }

  /**
   * Start webinar
   */
  startWebinar() {
    if (!this.webinarId) return;

    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.webinarState.isActive = true;
        this.updateWebinarStatus();
        this.showNotification('Webinar started', 'Webinar has been started successfully');
      } else {
        console.error('Failed to start webinar:', data.message);
        this.showNotification('Error', data.message || 'Failed to start webinar');
      }
    })
    .catch(error => {
      console.error('Error starting webinar:', error);
      this.showNotification('Error', 'An error occurred while starting the webinar');
    });
  }

  /**
   * End webinar
   */
  endWebinar() {
    if (!this.webinarId) return;

    if (!confirm('Are you sure you want to end this webinar? This will disconnect all participants.')) {
      return;
    }

    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}/end`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.webinarState.isActive = false;
        this.updateWebinarStatus();
        this.showNotification('Webinar ended', 'Webinar has been ended successfully');
      } else {
        console.error('Failed to end webinar:', data.message);
        this.showNotification('Error', data.message || 'Failed to end webinar');
      }
    })
    .catch(error => {
      console.error('Error ending webinar:', error);
      this.showNotification('Error', 'An error occurred while ending the webinar');
    });
  }

  /**
   * Start recording on a specific whiteboard
   * @param {String} whiteboardId - Whiteboard ID
   */
  startRecording(whiteboardId) {
    if (!this.webinarId || !whiteboardId) return;

    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/start`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showNotification('Recording started', `Recording started on whiteboard ${whiteboardId}`);
      } else {
        console.error('Failed to start recording:', data.message);
        this.showNotification('Error', data.message || 'Failed to start recording');
      }
    })
    .catch(error => {
      console.error('Error starting recording:', error);
      this.showNotification('Error', 'An error occurred while starting the recording');
    });
  }

  /**
   * Stop recording on a specific whiteboard
   * @param {String} whiteboardId - Whiteboard ID
   */
  stopRecording(whiteboardId) {
    if (!this.webinarId || !whiteboardId) return;

    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/stop`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showNotification('Recording stopped', `Recording stopped on whiteboard ${whiteboardId}`);
      } else {
        console.error('Failed to stop recording:', data.message);
        this.showNotification('Error', data.message || 'Failed to stop recording');
      }
    })
    .catch(error => {
      console.error('Error stopping recording:', error);
      this.showNotification('Error', 'An error occurred while stopping the recording');
    });
  }

  /**
   * Delete recording
   * @param {String} whiteboardId - Whiteboard ID
   * @param {String} recordingId - Recording ID
   */
  deleteRecording(whiteboardId, recordingId) {
    if (!this.webinarId || !whiteboardId || !recordingId) return;

    if (!confirm('Are you sure you want to delete this recording? This action cannot be undone.')) {
      return;
    }

    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}/whiteboards/${whiteboardId}/recordings/${recordingId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove recording from state
        this.webinarState.recordings = this.webinarState.recordings.filter(
          r => !(r.id === recordingId && r.whiteboardId === whiteboardId)
        );
        this.renderRecordingsList();
        this.showNotification('Recording deleted', 'Recording has been deleted successfully');
      } else {
        console.error('Failed to delete recording:', data.message);
        this.showNotification('Error', data.message || 'Failed to delete recording');
      }
    })
    .catch(error => {
      console.error('Error deleting recording:', error);
      this.showNotification('Error', 'An error occurred while deleting the recording');
    });
  }

  /**
   * Mute all participants
   */
  muteAllParticipants() {
    if (!this.webinarId) return;

    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}/mute-all`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      }
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showNotification('All muted', 'All participants have been muted');
      } else {
        console.error('Failed to mute all participants:', data.message);
        this.showNotification('Error', data.message || 'Failed to mute all participants');
      }
    })
    .catch(error => {
      console.error('Error muting all participants:', error);
      this.showNotification('Error', 'An error occurred while muting all participants');
    });
  }

  /**
   * Create a breakout room
   */
  createBreakoutRoom() {
    if (!this.webinarId) return;

    const roomName = prompt('Enter a name for the breakout room:');
    if (!roomName) return;

    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}/breakout-rooms`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: roomName
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success && data.breakoutRoom) {
        this.webinarState.breakoutRooms.push(data.breakoutRoom);
        this.renderBreakoutRoomsList();
        this.showNotification('Breakout room created', `Breakout room "${roomName}" created successfully`);
      } else {
        console.error('Failed to create breakout room:', data.message);
        this.showNotification('Error', data.message || 'Failed to create breakout room');
      }
    })
    .catch(error => {
      console.error('Error creating breakout room:', error);
      this.showNotification('Error', 'An error occurred while creating the breakout room');
    });
  }

  /**
   * Ban a participant
   * @param {String} participantId - Participant ID
   */
  banParticipant(participantId) {
    if (!this.webinarId || !participantId) return;

    if (!confirm('Are you sure you want to ban this participant? They will not be able to rejoin.')) {
      return;
    }

    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}/ban-participant`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        participantId: participantId
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Remove participant from state
        this.webinarState.participants = this.webinarState.participants.filter(
          p => p.id !== participantId
        );
        this.renderParticipantsList();
        this.showNotification('Participant banned', 'Participant has been banned from the webinar');
      } else {
        console.error('Failed to ban participant:', data.message);
        this.showNotification('Error', data.message || 'Failed to ban participant');
      }
    })
    .catch(error => {
      console.error('Error banning participant:', error);
      this.showNotification('Error', 'An error occurred while banning the participant');
    });
  }

  /**
   * Save webinar settings
   */
  saveSettings() {
    if (!this.webinarId) return;

    // Collect settings from UI
    const settings = {
      chatEnabled: document.getElementById('chat-enabled')?.checked ?? true,
      allowRecording: document.getElementById('allow-recording')?.checked ?? true,
      allowScreenSharing: document.getElementById('allow-screen-sharing')?.checked ?? true,
      allowAnnotations: document.getElementById('allow-annotations')?.checked ?? true,
      videoQuality: document.getElementById('video-quality')?.value || 'high',
      requireApproval: document.getElementById('require-approval')?.checked ?? false,
      encryptionEnabled: document.getElementById('encryption-enabled')?.checked ?? true
    };

    fetch(`${this.apiBaseUrl}/admin/webinars/${this.webinarId}/settings`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${this.adminToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        settings: settings
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.webinarState.currentSettings = settings;
        this.renderSettings();
        this.showNotification('Settings saved', 'Webinar settings have been saved successfully');
      } else {
        console.error('Failed to save settings:', data.message);
        this.showNotification('Error', data.message || 'Failed to save settings');
      }
    })
    .catch(error => {
      console.error('Error saving settings:', error);
      this.showNotification('Error', 'An error occurred while saving settings');
    });
  }

  /**
   * Show a notification toast
   * @param {String} title - Notification title
   * @param {String} message - Notification message
   */
  showNotification(title, message) {
    // This would typically be implemented in a shared utilities class
    console.log(`Notification: ${title} - ${message}`);

    // Simple implementation for admin panel
    const notificationsContainer = document.querySelector('.admin-notifications') ||
      (() => {
        const container = document.createElement('div');
        container.className = 'admin-notifications';
        document.body.appendChild(container);
        return container;
      })();

    const notification = document.createElement('div');
    notification.className = 'admin-notification';
    notification.innerHTML = `
      <div class="notification-title">${title}</div>
      <div class="notification-message">${message}</div>
    `;

    notificationsContainer.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      notification.classList.add('fade-out');
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }
}

// Export the class
window.WhiteboardRecordingAdminControls = WhiteboardRecordingAdminControls;
