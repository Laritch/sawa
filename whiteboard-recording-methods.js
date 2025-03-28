/**
 * Toggle presentation mode for a whiteboard
 * @param {String} whiteboardId - Whiteboard ID
 * @param {Boolean} enableMode - Whether to enable presentation mode
 * @param {String} userId - User ID making the request
 * @returns {Object} - Updated whiteboard
 */
webinarSchema.methods.togglePresentationMode = async function(whiteboardId, enableMode, userId) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Only host or presenter can toggle presentation mode
  const isHostOrPresenter = this.host.equals(userId) ||
    this.presenters.some(presenter => presenter.user && presenter.user.toString() === userId);

  if (!isHostOrPresenter) {
    throw new Error('Only hosts and presenters can toggle presentation mode');
  }

  whiteboard.presentationMode = enableMode;
  whiteboard.lastModified = new Date();

  await this.save();
  return whiteboard;
};

/**
 * Check if user has edit permission for a whiteboard
 * @param {Object} whiteboard - Whiteboard object
 * @param {String} userId - User ID
 * @returns {Boolean} - Whether user has edit permission
 * @throws {Error} - If user doesn't have permission
 */
webinarSchema.methods.checkWhiteboardEditPermission = function(whiteboard, userId) {
  // If whiteboard is in presentation mode, only host or presenters can edit
  if (whiteboard.presentationMode) {
    const isHostOrPresenter = this.host.equals(userId) ||
      this.presenters.some(presenter => presenter.user && presenter.user.toString() === userId);

    if (!isHostOrPresenter) {
      throw new Error('Whiteboard is in presentation mode. Only hosts and presenters can edit.');
    }

    return true;
  }

  // Normal permission check
  const isEditor = whiteboard.editors.some(
    editor => editor.user && editor.user.toString() === userId && editor.canEdit
  );

  const isCreator = whiteboard.createdBy && whiteboard.createdBy.toString() === userId;

  if (!isEditor && !isCreator) {
    throw new Error('Not authorized to edit this whiteboard');
  }

  return true;
};

/**
 * Start recording a whiteboard session
 * @param {String} whiteboardId - Whiteboard ID
 * @param {String} userId - User ID starting the recording
 * @returns {Object} - Updated whiteboard
 */
webinarSchema.methods.startWhiteboardRecording = async function(whiteboardId, userId) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Check if user is host or presenter
  const isHostOrPresenter = this.host.equals(userId) ||
    this.presenters.some(presenter => presenter.user && presenter.user.toString() === userId);

  if (!isHostOrPresenter) {
    throw new Error('Only hosts and presenters can start recording');
  }

  // Check if already recording
  if (whiteboard.recording && whiteboard.recording.isRecording) {
    throw new Error('Whiteboard is already being recorded');
  }

  // Initialize recording if it doesn't exist
  if (!whiteboard.recording) {
    whiteboard.recording = {
      isRecording: true,
      startedAt: new Date(),
      frames: []
    };
  } else {
    whiteboard.recording.isRecording = true;
    whiteboard.recording.startedAt = new Date();
    // Keep existing frames for resuming recording
  }

  // Add initial frame with full canvas data
  whiteboard.recording.frames.push({
    timestamp: new Date(),
    canvasData: whiteboard.canvasData,
    action: 'full',
    userId: userId
  });

  await this.save();
  return whiteboard;
};

/**
 * Stop recording a whiteboard session
 * @param {String} whiteboardId - Whiteboard ID
 * @param {String} userId - User ID stopping the recording
 * @returns {Object} - Updated whiteboard
 */
webinarSchema.methods.stopWhiteboardRecording = async function(whiteboardId, userId) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Check if user is host or presenter
  const isHostOrPresenter = this.host.equals(userId) ||
    this.presenters.some(presenter => presenter.user && presenter.user.toString() === userId);

  if (!isHostOrPresenter) {
    throw new Error('Only hosts and presenters can stop recording');
  }

  // Check if currently recording
  if (!whiteboard.recording || !whiteboard.recording.isRecording) {
    throw new Error('Whiteboard is not currently being recorded');
  }

  // Update recording state
  whiteboard.recording.isRecording = false;
  whiteboard.recording.stoppedAt = new Date();

  await this.save();
  return whiteboard;
};

/**
 * Add frame to whiteboard recording
 * @param {String} whiteboardId - Whiteboard ID
 * @param {Object} frameData - Frame data to add
 * @returns {Object} - Updated whiteboard
 */
webinarSchema.methods.addWhiteboardRecordingFrame = async function(whiteboardId, frameData) {
  const whiteboard = this.whiteboards.id(whiteboardId);
  if (!whiteboard) {
    throw new Error('Whiteboard not found');
  }

  // Check if currently recording
  if (!whiteboard.recording || !whiteboard.recording.isRecording) {
    return whiteboard; // Silently ignore if not recording
  }

  // Add frame
  whiteboard.recording.frames.push({
    timestamp: new Date(),
    canvasData: frameData.canvasData || whiteboard.canvasData,
    action: frameData.action,
    objectId: frameData.objectId,
    userId: frameData.userId
  });

  // Limit frames to prevent excessive storage use (optional)
  if (whiteboard.recording.frames.length > 10000) {
    whiteboard.recording.frames = whiteboard.recording.frames.slice(-10000);
  }

  await this.save();
  return whiteboard;
};
