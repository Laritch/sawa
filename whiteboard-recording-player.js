/**
 * Whiteboard Recording Player
 * Handles playback of recorded whiteboard sessions
 */
class WhiteboardRecordingPlayer {
  constructor(options) {
    this.webinarId = options.webinarId;
    this.whiteboardId = options.whiteboardId;
    this.recordingData = null;
    this.currentFrameIndex = 0;
    this.isPlaying = false;
    this.playbackSpeed = 1;
    this.playbackInterval = null;
    this.canvas = null;
    this.fabricCanvas = null;
    this.loadingElement = document.getElementById('whiteboard-recording-loading');
    this.errorElement = document.getElementById('whiteboard-recording-error');
    this.playerControls = document.getElementById('whiteboard-recording-controls');
    this.progressSlider = document.getElementById('recording-progress');
    this.timeDisplay = document.getElementById('recording-time-display');
    this.speedControl = document.getElementById('recording-speed');

    this.initialize();
  }

  /**
   * Initialize the recording player
   */
  initialize() {
    // Initialize canvas
    this.canvas = document.getElementById('whiteboard-recording-canvas');
    if (!this.canvas) {
      this.showError('Canvas element not found');
      return;
    }

    // Create fabric canvas
    this.fabricCanvas = new fabric.Canvas('whiteboard-recording-canvas', {
      isDrawingMode: false,
      selection: false,
      renderOnAddRemove: true
    });

    // Set canvas size
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());

    // Set up event listeners for playback controls
    this.setupEventListeners();
  }

  /**
   * Set up event listeners for player controls
   */
  setupEventListeners() {
    document.getElementById('recording-play-pause')?.addEventListener('click', () => {
      this.togglePlayback();
    });

    document.getElementById('recording-stop')?.addEventListener('click', () => {
      this.stopPlayback();
    });

    document.getElementById('recording-progress')?.addEventListener('input', (e) => {
      this.seekToPosition(parseInt(e.target.value));
    });

    document.getElementById('recording-speed')?.addEventListener('change', (e) => {
      this.setPlaybackSpeed(parseFloat(e.target.value));
    });
  }

  /**
   * Load recording data from the server
   * @param {String} recordingId - ID of the recording to load
   */
  async loadRecording(recordingId) {
    try {
      this.showLoading(true);

      const response = await fetch(`/api/webinars/${this.webinarId}/whiteboards/${this.whiteboardId}/recordings/${recordingId}`);
      if (!response.ok) {
        throw new Error(`Failed to load recording: ${response.statusText}`);
      }

      const data = await response.json();
      this.recordingData = data.recording;

      if (!this.recordingData || !this.recordingData.frames || this.recordingData.frames.length === 0) {
        throw new Error('Recording data is empty or invalid');
      }

      // Update player UI
      this.updatePlayerUI();
      this.showLoading(false);

      // Reset to beginning
      this.currentFrameIndex = 0;
      this.renderCurrentFrame();

      return true;
    } catch (error) {
      console.error('Error loading recording:', error);
      this.showError(`Failed to load recording: ${error.message}`);
      this.showLoading(false);
      return false;
    }
  }

  /**
   * Update player UI with recording information
   */
  updatePlayerUI() {
    if (!this.recordingData || !this.recordingData.frames) return;

    // Set max value of progress slider
    this.progressSlider.max = this.recordingData.frames.length - 1;
    this.progressSlider.value = 0;

    // Update time display
    this.updateTimeDisplay();

    // Enable controls
    this.enableControls(true);
  }

  /**
   * Toggle play/pause of the recording
   */
  togglePlayback() {
    if (this.isPlaying) {
      this.pausePlayback();
    } else {
      this.startPlayback();
    }
  }

  /**
   * Start playback of the recording
   */
  startPlayback() {
    if (this.isPlaying || !this.recordingData) return;

    // Update play button
    const playButton = document.getElementById('recording-play-pause');
    if (playButton) {
      playButton.innerHTML = '<i class="fas fa-pause"></i>';
      playButton.title = 'Pause';
    }

    this.isPlaying = true;

    // If at the end, start from beginning
    if (this.currentFrameIndex >= this.recordingData.frames.length - 1) {
      this.currentFrameIndex = 0;
    }

    // Start playback interval
    const frameDuration = 1000 / (10 * this.playbackSpeed); // Base speed: 10 frames per second

    this.playbackInterval = setInterval(() => {
      this.playNextFrame();
    }, frameDuration);
  }

  /**
   * Pause playback of the recording
   */
  pausePlayback() {
    if (!this.isPlaying) return;

    // Update play button
    const playButton = document.getElementById('recording-play-pause');
    if (playButton) {
      playButton.innerHTML = '<i class="fas fa-play"></i>';
      playButton.title = 'Play';
    }

    this.isPlaying = false;

    // Clear interval
    if (this.playbackInterval) {
      clearInterval(this.playbackInterval);
      this.playbackInterval = null;
    }
  }

  /**
   * Stop playback and reset to beginning
   */
  stopPlayback() {
    this.pausePlayback();
    this.currentFrameIndex = 0;
    this.renderCurrentFrame();
    this.updateProgressUI();
  }

  /**
   * Play the next frame in the recording
   */
  playNextFrame() {
    if (!this.recordingData || !this.recordingData.frames) return;

    // Check if we've reached the end
    if (this.currentFrameIndex >= this.recordingData.frames.length - 1) {
      this.pausePlayback();
      return;
    }

    // Move to next frame
    this.currentFrameIndex++;

    // Render frame
    this.renderCurrentFrame();

    // Update progress UI
    this.updateProgressUI();
  }

  /**
   * Render the current frame
   */
  renderCurrentFrame() {
    if (!this.recordingData || !this.recordingData.frames || this.recordingData.frames.length === 0) return;

    const frame = this.recordingData.frames[this.currentFrameIndex];

    // For 'full' frames, load the entire canvas data
    if (frame.action === 'full') {
      this.renderFullFrame(frame.canvasData);
    }
    // For other actions, we would need to incrementally apply changes
    // This would depend on how the changes were recorded
    else {
      this.applyFrameAction(frame);
    }
  }

  /**
   * Render a full frame from canvas data
   * @param {String} canvasData - JSON string of canvas data
   */
  renderFullFrame(canvasData) {
    try {
      // Clear existing canvas
      this.fabricCanvas.clear();

      // Load from JSON
      this.fabricCanvas.loadFromJSON(canvasData, () => {
        this.fabricCanvas.renderAll();
      });
    } catch (error) {
      console.error('Error rendering full frame:', error);
    }
  }

  /**
   * Apply a frame action to the canvas
   * @param {Object} frame - Frame data
   */
  applyFrameAction(frame) {
    try {
      switch (frame.action) {
        case 'add':
          // Add object to canvas
          const newObject = JSON.parse(frame.canvasData);
          fabric.util.enlivenObjects([newObject], (objects) => {
            const obj = objects[0];
            obj.id = frame.objectId;
            this.fabricCanvas.add(obj);
            this.fabricCanvas.renderAll();
          });
          break;

        case 'modify':
          // Modify existing object
          const modifiedObject = JSON.parse(frame.canvasData);
          const existingObject = this.fabricCanvas.getObjects().find(obj => obj.id === frame.objectId);
          if (existingObject) {
            existingObject.set(modifiedObject);
            existingObject.setCoords();
            this.fabricCanvas.renderAll();
          }
          break;

        case 'remove':
          // Remove object from canvas
          const objectToRemove = this.fabricCanvas.getObjects().find(obj => obj.id === frame.objectId);
          if (objectToRemove) {
            this.fabricCanvas.remove(objectToRemove);
            this.fabricCanvas.renderAll();
          }
          break;

        case 'clear':
          // Clear canvas
          this.fabricCanvas.clear();
          break;
      }
    } catch (error) {
      console.error(`Error applying frame action ${frame.action}:`, error);
    }
  }

  /**
   * Seek to a specific position in the recording
   * @param {Number} position - Frame index to seek to
   */
  seekToPosition(position) {
    if (!this.recordingData || !this.recordingData.frames) return;

    // Validate position
    position = Math.max(0, Math.min(position, this.recordingData.frames.length - 1));

    // Pause playback
    const wasPlaying = this.isPlaying;
    this.pausePlayback();

    // If seeking backwards, start from a full frame
    if (position < this.currentFrameIndex) {
      // Find the latest full frame before the target position
      let fullFrameIndex = 0;
      for (let i = position; i >= 0; i--) {
        if (this.recordingData.frames[i].action === 'full') {
          fullFrameIndex = i;
          break;
        }
      }

      // Start from that full frame
      this.currentFrameIndex = fullFrameIndex;
      this.renderCurrentFrame();

      // Apply all frames up to the target position
      for (let i = fullFrameIndex + 1; i <= position; i++) {
        this.currentFrameIndex = i;
        this.renderCurrentFrame();
      }
    } else {
      // If seeking forward, just apply frames sequentially
      for (let i = this.currentFrameIndex + 1; i <= position; i++) {
        this.currentFrameIndex = i;
        this.renderCurrentFrame();
      }
    }

    // Update UI
    this.updateProgressUI();

    // Resume playback if it was playing
    if (wasPlaying) {
      this.startPlayback();
    }
  }

  /**
   * Set the playback speed
   * @param {Number} speed - Playback speed (0.5 to 2)
   */
  setPlaybackSpeed(speed) {
    this.playbackSpeed = speed;

    // If currently playing, restart with new speed
    if (this.isPlaying) {
      this.pausePlayback();
      this.startPlayback();
    }
  }

  /**
   * Update progress UI elements
   */
  updateProgressUI() {
    // Update progress slider
    this.progressSlider.value = this.currentFrameIndex;

    // Update time display
    this.updateTimeDisplay();
  }

  /**
   * Update time display
   */
  updateTimeDisplay() {
    if (!this.recordingData || !this.recordingData.frames || !this.timeDisplay) return;

    const currentFrame = this.recordingData.frames[this.currentFrameIndex];
    const totalFrames = this.recordingData.frames.length;

    // Calculate elapsed time based on timestamps
    let elapsedTimeMs = 0;
    let totalDurationMs = 0;

    if (currentFrame && currentFrame.timestamp) {
      const startTime = new Date(this.recordingData.frames[0].timestamp).getTime();
      const currentTime = new Date(currentFrame.timestamp).getTime();
      elapsedTimeMs = currentTime - startTime;

      const endTime = new Date(this.recordingData.frames[totalFrames - 1].timestamp).getTime();
      totalDurationMs = endTime - startTime;
    }

    // Format time as mm:ss
    const formatTime = (ms) => {
      const seconds = Math.floor(ms / 1000);
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    };

    this.timeDisplay.textContent = `${formatTime(elapsedTimeMs)} / ${formatTime(totalDurationMs)}`;
  }

  /**
   * Resize canvas to fit container
   */
  resizeCanvas() {
    const container = this.canvas.parentElement;
    if (!container) return;

    const width = container.clientWidth;
    const height = container.clientHeight;

    this.canvas.width = width;
    this.canvas.height = height;

    this.fabricCanvas.setWidth(width);
    this.fabricCanvas.setHeight(height);
    this.fabricCanvas.renderAll();
  }

  /**
   * Show/hide loading indicator
   * @param {Boolean} show - Whether to show loading indicator
   */
  showLoading(show) {
    if (this.loadingElement) {
      this.loadingElement.style.display = show ? 'flex' : 'none';
    }
  }

  /**
   * Show error message
   * @param {String} message - Error message to display
   */
  showError(message) {
    if (this.errorElement) {
      const messageElement = this.errorElement.querySelector('p');
      if (messageElement) {
        messageElement.textContent = message;
      }
      this.errorElement.style.display = 'flex';
    }

    console.error('Whiteboard Recording Player Error:', message);
  }

  /**
   * Enable/disable player controls
   * @param {Boolean} enable - Whether to enable controls
   */
  enableControls(enable) {
    if (this.playerControls) {
      const controls = this.playerControls.querySelectorAll('button, input, select');
      controls.forEach(control => {
        control.disabled = !enable;
      });
    }
  }
}
