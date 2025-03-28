// Whiteboard UI Module
class WhiteboardUI {
  constructor(whiteboardManager) {
    this.whiteboardManager = whiteboardManager;
    this.toolbarId = 'whiteboard-toolbar';
    this.colorPickerId = 'whiteboard-color-picker';
    this.lineWidthId = 'whiteboard-line-width';
    this.whiteboardsListId = 'whiteboards-list';
    this.imageHandler = null;
    this.isRecording = false;
    this.recordingStartTime = null;
    this.recordingTimer = null;
    this.initialize();
  }

  /**
   * Initialize the whiteboard UI
   */
  initialize() {
    this.createToolbar();
    this.setupEventListeners();
    this.imageHandler = new WhiteboardImageHandler(this.whiteboardManager);
  }

  /**
   * Create the whiteboard toolbar
   */
  createToolbar() {
    const toolbar = document.getElementById(this.toolbarId);
    if (!toolbar) return;

    toolbar.innerHTML = `
      <div class="whiteboard-tools">
        <button id="wb-tool-select" class="wb-tool active" title="Select">
          <i class="fas fa-mouse-pointer"></i>
        </button>
        <button id="wb-tool-draw" class="wb-tool" title="Draw">
          <i class="fas fa-pen"></i>
        </button>
        <button id="wb-tool-rectangle" class="wb-tool" title="Rectangle">
          <i class="far fa-square"></i>
        </button>
        <button id="wb-tool-circle" class="wb-tool" title="Circle">
          <i class="far fa-circle"></i>
        </button>
        <button id="wb-tool-text" class="wb-tool" title="Text">
          <i class="fas fa-font"></i>
        </button>
        <button id="wb-tool-image" class="wb-tool" title="Add Image">
          <i class="fas fa-image"></i>
        </button>
        <button id="wb-tool-delete" class="wb-tool" title="Delete selected">
          <i class="fas fa-trash"></i>
        </button>
      </div>
      <div class="whiteboard-style-controls">
        <div class="color-picker-container">
          <input type="color" id="${this.colorPickerId}" value="#000000">
          <label for="${this.colorPickerId}">Color</label>
        </div>
        <div class="line-width-container">
          <input type="range" id="${this.lineWidthId}" min="1" max="20" value="2">
          <label for="${this.lineWidthId}">Width</label>
        </div>
      </div>
      <div class="whiteboard-actions">
        <button id="wb-action-clear" title="Clear whiteboard">
          <i class="fas fa-trash-alt"></i> Clear
        </button>
        <button id="wb-action-save" title="Save whiteboard">
          <i class="fas fa-save"></i> Save
        </button>
        <button id="wb-action-new" title="New whiteboard">
          <i class="fas fa-plus"></i> New
        </button>
      </div>
      <div class="whiteboard-presentation-controls">
        <button id="wb-presentation-mode" title="Toggle presentation mode">
          <i class="fas fa-chalkboard-teacher"></i> Presentation Mode: <span id="presentation-mode-status">Off</span>
        </button>
      </div>
      <div class="whiteboard-recording-controls">
        <button id="wb-recording-toggle" title="Toggle recording">
          <i class="fas fa-circle"></i> Record
        </button>
        <span id="recording-status" class="recording-status" style="display: none;">Recording: <span id="recording-time">00:00</span></span>
        <button id="wb-view-recordings" title="View recordings" style="display: none;">
          <i class="fas fa-play-circle"></i> View Recordings
        </button>
      </div>
      <div class="whiteboard-list-container">
        <label for="${this.whiteboardsListId}">Whiteboards</label>
        <select id="${this.whiteboardsListId}"></select>
      </div>
    `;
  }

  /**
   * Set up event listeners for toolbar buttons
   */
  setupEventListeners() {
    // Mode selection buttons
    document.getElementById('wb-tool-select')?.addEventListener('click', () => this.setActiveTool('select'));
    document.getElementById('wb-tool-draw')?.addEventListener('click', () => this.setActiveTool('draw'));
    document.getElementById('wb-tool-rectangle')?.addEventListener('click', () => this.setActiveTool('rectangle'));
    document.getElementById('wb-tool-circle')?.addEventListener('click', () => this.setActiveTool('circle'));
    document.getElementById('wb-tool-text')?.addEventListener('click', () => this.setActiveTool('text'));
    document.getElementById('wb-tool-delete')?.addEventListener('click', () => this.whiteboardManager.deleteSelected());

    // Image tool button
    document.getElementById('wb-tool-image')?.addEventListener('click', () => {
      // Check if in presentation mode and not host/presenter
      if (this.whiteboardManager.presentationMode &&
          !this.whiteboardManager.isHost &&
          !this.whiteboardManager.isPresenter) {
        alert('Cannot upload images while in presentation mode');
        return;
      }

      // Trigger file input click
      const fileInput = document.getElementById('whiteboard-image-upload');
      if (fileInput) {
        fileInput.click();
      }
    });

    // Style controls
    document.getElementById(this.colorPickerId)?.addEventListener('change', (e) => {
      this.whiteboardManager.setColor(e.target.value);
    });

    document.getElementById(this.lineWidthId)?.addEventListener('input', (e) => {
      this.whiteboardManager.setLineWidth(parseInt(e.target.value));
    });

    // Actions
    document.getElementById('wb-action-clear')?.addEventListener('click', () => {
      if (confirm('Are you sure you want to clear the whiteboard?')) {
        this.whiteboardManager.clearWhiteboard();
      }
    });

    document.getElementById('wb-action-save')?.addEventListener('click', () => {
      this.whiteboardManager.saveWhiteboard();
    });

    document.getElementById('wb-action-new')?.addEventListener('click', () => {
      const name = prompt('Enter whiteboard name', `Whiteboard ${this.whiteboardManager.whiteboards.length + 1}`);
      if (name) {
        this.whiteboardManager.createWhiteboard({ name });
      }
    });

    // Presentation mode toggle
    document.getElementById('wb-presentation-mode')?.addEventListener('click', () => {
      // Only available for hosts and presenters
      if (!this.whiteboardManager.isHost && !this.whiteboardManager.isPresenter) {
        alert('Only hosts and presenters can toggle presentation mode');
        return;
      }

      const currentState = this.whiteboardManager.presentationMode;
      this.whiteboardManager.togglePresentationMode(!currentState);
    });

    // Recording controls
    document.getElementById('wb-recording-toggle')?.addEventListener('click', () => {
      // Only available for hosts and presenters
      if (!this.whiteboardManager.isHost && !this.whiteboardManager.isPresenter) {
        alert('Only hosts and presenters can manage recordings');
        return;
      }

      if (this.isRecording) {
        this.stopRecording();
      } else {
        this.startRecording();
      }
    });

    // View recordings button
    document.getElementById('wb-view-recordings')?.addEventListener('click', () => {
      this.viewRecordings();
    });

    // Whiteboard selection
    document.getElementById(this.whiteboardsListId)?.addEventListener('change', (e) => {
      this.whiteboardManager.switchWhiteboard(e.target.value);
    });

    // Tool-specific event listeners
    document.addEventListener('whiteboard:mode:changed', (e) => {
      this.updateToolbarState(e.detail.mode);
    });

    // External events
    document.addEventListener('whiteboard:list:updated', (e) => {
      this.updateWhiteboardsList(e.detail.whiteboards);
    });

    // External events for presentation mode
    document.addEventListener('whiteboard:presentation-mode-changed', (e) => {
      this.updatePresentationModeState(e.detail.presentationMode);
    });

    // Canvas-specific event handlers for shape creation
    if (this.whiteboardManager.canvas) {
      this.setupCanvasEventHandlers();
    }

    // Socket events for recording
    if (this.whiteboardManager.socket) {
      this.setupRecordingSocketListeners();
    }

    // Check if there are recordings for the current whiteboard
    this.checkForRecordings();
  }

  /**
   * Set up socket listeners for recording events
   */
  setupRecordingSocketListeners() {
    // Listen for recording started event
    this.whiteboardManager.socket.on('whiteboard:recording:started', (data) => {
      if (data.whiteboardId === this.whiteboardManager.currentWhiteboardId) {
        // Update UI if someone else started recording
        if (data.userId !== this.whiteboardManager.userId) {
          this.updateRecordingUI(true);
        }
      }
    });

    // Listen for recording stopped event
    this.whiteboardManager.socket.on('whiteboard:recording:stopped', (data) => {
      if (data.whiteboardId === this.whiteboardManager.currentWhiteboardId) {
        // Update UI if someone else stopped recording
        if (data.userId !== this.whiteboardManager.userId) {
          this.updateRecordingUI(false);
          // Show the view recordings button
          this.showViewRecordingsButton();
        }
      }
    });

    // Listen for recording deleted event
    this.whiteboardManager.socket.on('whiteboard:recording:deleted', (data) => {
      if (data.whiteboardId === this.whiteboardManager.currentWhiteboardId) {
        // Hide the view recordings button if recordings were deleted
        document.getElementById('wb-view-recordings').style.display = 'none';
      }
    });
  }

  /**
   * Start recording the whiteboard session
   */
  async startRecording() {
    try {
      // Call API to start recording
      const response = await fetch(`/api/webinars/${this.whiteboardManager.webinarId}/whiteboards/${this.whiteboardManager.currentWhiteboardId}/recordings/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to start recording');
      }

      // Update UI
      this.isRecording = true;
      this.recordingStartTime = new Date();
      this.updateRecordingUI(true);

      // Start timer
      this.startRecordingTimer();
    } catch (error) {
      console.error('Error starting recording:', error);
      alert(`Failed to start recording: ${error.message}`);
    }
  }

  /**
   * Stop recording the whiteboard session
   */
  async stopRecording() {
    try {
      // Call API to stop recording
      const response = await fetch(`/api/webinars/${this.whiteboardManager.webinarId}/whiteboards/${this.whiteboardManager.currentWhiteboardId}/recordings/stop`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to stop recording');
      }

      // Update UI
      this.isRecording = false;
      this.recordingStartTime = null;
      this.updateRecordingUI(false);

      // Stop timer
      this.stopRecordingTimer();

      // Show the view recordings button
      this.showViewRecordingsButton();
    } catch (error) {
      console.error('Error stopping recording:', error);
      alert(`Failed to stop recording: ${error.message}`);
    }
  }

  /**
   * Start the recording timer
   */
  startRecordingTimer() {
    // Clear any existing timer
    if (this.recordingTimer) {
      clearInterval(this.recordingTimer);
    }

    // Start new timer
    this.recordingTimer = setInterval(() => {
      if (!this.recordingStartTime) return;

      const elapsed = new Date() - this.recordingStartTime;
      const seconds = Math.floor(elapsed / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;

      document.getElementById('recording-time').textContent =
        `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
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
    document.getElementById('recording-time').textContent = '00:00';
  }

  /**
   * Update the recording UI elements
   * @param {Boolean} isRecording - Whether recording is active
   */
  updateRecordingUI(isRecording) {
    const recordButton = document.getElementById('wb-recording-toggle');
    const recordingStatus = document.getElementById('recording-status');

    if (isRecording) {
      recordButton.innerHTML = '<i class="fas fa-stop-circle"></i> Stop';
      recordButton.classList.add('recording');
      recordingStatus.style.display = 'inline-block';
    } else {
      recordButton.innerHTML = '<i class="fas fa-circle"></i> Record';
      recordButton.classList.remove('recording');
      recordingStatus.style.display = 'none';
    }

    this.isRecording = isRecording;
  }

  /**
   * Show the view recordings button
   */
  showViewRecordingsButton() {
    document.getElementById('wb-view-recordings').style.display = 'inline-block';
  }

  /**
   * Check if there are recordings for the current whiteboard
   */
  async checkForRecordings() {
    try {
      // Don't check if there's no current whiteboard
      if (!this.whiteboardManager.currentWhiteboardId) return;

      const response = await fetch(`/api/webinars/${this.whiteboardManager.webinarId}/whiteboards/${this.whiteboardManager.currentWhiteboardId}/recordings`);

      if (!response.ok) {
        return;
      }

      const data = await response.json();

      // If there are recordings, show the view recordings button
      if (data.recording && data.recording.frameCount > 0) {
        this.showViewRecordingsButton();
      }
    } catch (error) {
      console.error('Error checking for recordings:', error);
    }
  }

  /**
   * Navigate to recordings playback page
   */
  viewRecordings() {
    window.open(`/whiteboard-recording-playback.html?webinarId=${this.whiteboardManager.webinarId}&whiteboardId=${this.whiteboardManager.currentWhiteboardId}`, '_blank');
  }
}
