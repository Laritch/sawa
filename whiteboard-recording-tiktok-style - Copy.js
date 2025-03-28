/**
 * WhiteboardRecordingTikTokStyle
 * Provides TikTok-like video enhancements for whiteboard recordings
 */
class WhiteboardRecordingTikTokStyle {
  constructor(options = {}) {
    this.player = options.player;
    this.canvasId = options.canvasId || 'player-canvas';
    this.webinarId = options.webinarId;
    this.container = options.container || document.querySelector('.player-canvas-container');

    // High-quality video settings
    this.videoSettings = {
      resolution: 'high', // high, ultra
      smoothing: true,
      frameRate: 60,
      bitrate: '6000k',
      optimizeForMobile: true
    };

    // Visual effects options
    this.visualEffects = {
      smoothTransitions: true,
      enhanceColors: true,
      sharpenStrokes: true,
      reduceNoise: true,
      autoCorrectLighting: true,
      adaptiveRendering: true
    };

    // UI enhancements
    this.uiEnhancements = {
      floatingReactions: true,
      smoothScrolling: true,
      interactiveElements: true,
      animatedTransitions: true
    };

    // Performance optimization
    this.performanceOptimization = {
      useRequestAnimationFrame: true,
      useWebGL: true,
      useCacheForStatic: true,
      preloadAssets: true,
      adaptiveBitrate: true,
      lowLatencyMode: true
    };

    // Canvas and context
    this.canvas = null;
    this.ctx = null;

    // Effects canvas (for overlay effects)
    this.effectsCanvas = null;
    this.effectsCtx = null;

    // Animation frame ID for RAF
    this.animationFrameId = null;

    // Floating reactions
    this.activeReactions = [];

    // Initialize
    this.initialize();
  }

  /**
   * Initialize TikTok-style enhancements
   */
  initialize() {
    console.log('Initializing TikTok-style enhancements');

    // Get main canvas
    this.canvas = document.getElementById(this.canvasId);
    if (!this.canvas) {
      console.error('Canvas not found:', this.canvasId);
      return;
    }

    this.ctx = this.canvas.getContext('2d', {
      alpha: true,
      desynchronized: true, // Reduce latency
      willReadFrequently: false // Performance optimization
    });

    // Create effects canvas as an overlay
    this.createEffectsCanvas();

    // Setup event listeners
    this.setupEventListeners();

    // Apply initial settings
    this.applyVideoSettings();

    // Start performance monitoring
    this.startPerformanceMonitoring();
  }

  /**
   * Apply high-quality video settings
   */
  applyVideoSettings() {
    // Apply resolution based on settings
    if (this.videoSettings.resolution === 'high') {
      this.setCanvasResolution(1080);
    } else if (this.videoSettings.resolution === 'ultra') {
      this.setCanvasResolution(1440);
    }

    // Apply image smoothing for crisp lines
    if (this.ctx) {
      this.ctx.imageSmoothingEnabled = this.videoSettings.smoothing;
      this.ctx.imageSmoothingQuality = 'high';
    }

    if (this.effectsCtx) {
      this.effectsCtx.imageSmoothingEnabled = this.videoSettings.smoothing;
      this.effectsCtx.imageSmoothingQuality = 'high';
    }
  }

  /**
   * Set canvas resolution while maintaining aspect ratio
   * @param {Number} height - Target height in pixels
   */
  setCanvasResolution(height) {
    if (!this.canvas || !this.container) return;

    const containerWidth = this.container.clientWidth;
    const containerHeight = this.container.clientHeight;
    const aspectRatio = containerWidth / containerHeight;

    // Calculate new dimensions while maintaining aspect ratio
    const newHeight = height;
    const newWidth = Math.round(height * aspectRatio);

    // Set canvas dimensions (actual pixels)
    this.canvas.width = newWidth;
    this.canvas.height = newHeight;

    // Update effects canvas to match
    if (this.effectsCanvas) {
      this.effectsCanvas.width = newWidth;
      this.effectsCanvas.height = newHeight;
    }

    console.log(`Canvas resolution set to ${newWidth}x${newHeight}`);
  }

  /**
   * Create effects canvas overlay
   */
  createEffectsCanvas() {
    if (!this.container) return;

    // Create canvas for effects overlays
    this.effectsCanvas = document.createElement('canvas');
    this.effectsCanvas.className = 'effects-canvas';
    this.effectsCanvas.style.position = 'absolute';
    this.effectsCanvas.style.top = '0';
    this.effectsCanvas.style.left = '0';
    this.effectsCanvas.style.width = '100%';
    this.effectsCanvas.style.height = '100%';
    this.effectsCanvas.style.pointerEvents = 'none'; // Don't capture pointer events
    this.container.appendChild(this.effectsCanvas);

    // Match dimensions with main canvas
    this.effectsCanvas.width = this.canvas ? this.canvas.width : this.container.clientWidth;
    this.effectsCanvas.height = this.canvas ? this.canvas.height : this.container.clientHeight;

    // Get context
    this.effectsCtx = this.effectsCanvas.getContext('2d', {
      alpha: true,
      desynchronized: true
    });
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Reaction buttons
    const reactionButtons = document.querySelectorAll('.reaction-btn');
    reactionButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const reactionType = e.currentTarget.dataset.reaction;
        this.addFloatingReaction(reactionType);
      });
    });

    // Window resize event for responsive canvas
    window.addEventListener('resize', this.handleResize.bind(this));

    // Playback events if player exists
    if (this.player) {
      // Enhance player on play
      this.player.on('play', () => {
        this.startRenderLoop();
        if (this.uiEnhancements.animatedTransitions) {
          this.playStartAnimation();
        }
      });

      // Handle pause
      this.player.on('pause', () => {
        if (this.uiEnhancements.animatedTransitions) {
          this.playPauseAnimation();
        }
      });

      // Handle seeking
      this.player.on('seek', () => {
        if (this.visualEffects.smoothTransitions) {
          this.playSeekAnimation();
        }
      });
    }
  }

  /**
   * Handle window resize
   */
  handleResize() {
    // Update canvas size based on container
    if (this.canvas && this.container) {
      // Store current resolution setting to reapply
      const currentResolution = this.videoSettings.resolution;

      // Re-apply resolution setting after brief delay to ensure container has resized
      setTimeout(() => {
        if (currentResolution === 'high') {
          this.setCanvasResolution(1080);
        } else if (currentResolution === 'ultra') {
          this.setCanvasResolution(1440);
        } else {
          this.setCanvasResolution(720); // Default fallback
        }
      }, 100);
    }
  }

  /**
   * Start the render loop for animations and effects
   */
  startRenderLoop() {
    if (!this.performanceOptimization.useRequestAnimationFrame) return;

    const renderFrame = () => {
      // Clear effects canvas
      if (this.effectsCtx) {
        this.effectsCtx.clearRect(0, 0, this.effectsCanvas.width, this.effectsCanvas.height);
      }

      // Render active effects
      this.renderActiveEffects();

      // Render floating reactions
      this.updateAndRenderReactions();

      // Apply real-time visual enhancements to main content
      this.applyVisualEnhancements();

      // Continue animation loop
      this.animationFrameId = requestAnimationFrame(renderFrame);
    };

    // Start animation loop
    this.animationFrameId = requestAnimationFrame(renderFrame);
  }

  /**
   * Stop the render loop
   */
  stopRenderLoop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  /**
   * Add a floating reaction (like TikTok hearts, likes)
   * @param {String} type - Reaction type ('heart', 'like', 'wow', etc)
   */
  addFloatingReaction(type = 'heart') {
    if (!this.uiEnhancements.floatingReactions) return;

    // Create a new reaction object
    const canvasWidth = this.effectsCanvas.width;
    const canvasHeight = this.effectsCanvas.height;

    const reaction = {
      type: type,
      x: canvasWidth * (0.3 + Math.random() * 0.4), // Random position in middle 40% of width
      y: canvasHeight, // Start from bottom
      size: 30 + Math.random() * 20, // Random size between 30-50px
      speed: 1 + Math.random() * 2, // Random speed
      opacity: 1,
      rotation: -30 + Math.random() * 60, // Random rotation between -30 and 30 degrees
      color: this.getReactionColor(type)
    };

    // Add to active reactions
    this.activeReactions.push(reaction);

    // Limit total active reactions for performance
    if (this.activeReactions.length > 30) {
      this.activeReactions.shift(); // Remove oldest
    }
  }

  /**
   * Get color for reaction type
   * @param {String} type - Reaction type
   * @returns {String} - Color as CSS color string
   */
  getReactionColor(type) {
    switch(type) {
      case 'heart': return '#ff5252';
      case 'like': return '#2196F3';
      case 'wow': return '#ffeb3b';
      case 'clap': return '#4caf50';
      default: return '#ff5252';
    }
  }

  /**
   * Update and render floating reactions
   */
  updateAndRenderReactions() {
    if (!this.effectsCtx || !this.uiEnhancements.floatingReactions) return;

    const ctx = this.effectsCtx;
    const canvasHeight = this.effectsCanvas.height;

    // Update each reaction and render
    this.activeReactions = this.activeReactions.filter(reaction => {
      // Update position
      reaction.y -= reaction.speed;

      // Update opacity (fade out as it rises)
      reaction.opacity = Math.max(0, reaction.y / canvasHeight);

      // Remove if it's gone off the top or fully transparent
      if (reaction.y < -50 || reaction.opacity <= 0) {
        return false;
      }

      // Render the reaction
      ctx.save();
      ctx.globalAlpha = reaction.opacity;
      ctx.translate(reaction.x, reaction.y);
      ctx.rotate(reaction.rotation * Math.PI / 180);

      // Draw based on type
      if (reaction.type === 'heart') {
        this.drawHeart(ctx, 0, 0, reaction.size, reaction.color);
      } else if (reaction.type === 'like') {
        this.drawThumbsUp(ctx, 0, 0, reaction.size, reaction.color);
      } else {
        // Default circle with emoji
        ctx.fillStyle = reaction.color;
        ctx.beginPath();
        ctx.arc(0, 0, reaction.size/2, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#fff';
        ctx.font = `${reaction.size * 0.6}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(this.getEmojiForReaction(reaction.type), 0, 0);
      }

      ctx.restore();

      return true;
    });
  }

  /**
   * Draw a heart shape
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Number} x - Center X position
   * @param {Number} y - Center Y position
   * @param {Number} size - Size of heart
   * @param {String} color - Fill color
   */
  drawHeart(ctx, x, y, size, color) {
    const width = size;
    const height = size;

    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x, y + height/4);
    ctx.quadraticCurveTo(x, y, x + width/4, y);
    ctx.quadraticCurveTo(x + width/2, y, x + width/2, y + height/4);
    ctx.quadraticCurveTo(x + width/2, y, x + width * 3/4, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + height/4);
    ctx.quadraticCurveTo(x + width, y + height/2, x + width * 3/4, y + height * 3/4);
    ctx.lineTo(x + width/2, y + height);
    ctx.lineTo(x + width/4, y + height * 3/4);
    ctx.quadraticCurveTo(x, y + height/2, x, y + height/4);
    ctx.fill();
  }

  /**
   * Draw thumbs up icon
   * @param {CanvasRenderingContext2D} ctx - Canvas context
   * @param {Number} x - Center X position
   * @param {Number} y - Center Y position
   * @param {Number} size - Size of thumb
   * @param {String} color - Fill color
   */
  drawThumbsUp(ctx, x, y, size, color) {
    // Simplified thumb up icon
    ctx.fillStyle = color;

    // Create thumb shape
    ctx.beginPath();
    ctx.rect(x - size/4, y - size/4, size/2, size/2);
    ctx.arc(x, y - size/4, size/4, 0, Math.PI, true);
    ctx.fill();
  }

  /**
   * Get emoji for reaction type
   * @param {String} type - Reaction type
   * @returns {String} - Emoji character
   */
  getEmojiForReaction(type) {
    switch(type) {
      case 'heart': return '❤️';
      case 'like': return '👍';
      case 'wow': return '😲';
      case 'clap': return '👏';
      case 'laugh': return '😂';
      case 'support': return '🙌';
      default: return '👍';
    }
  }

  /**
   * Apply real-time visual enhancements to the main canvas
   * Simulates the high-quality, smooth look of TikTok videos
   */
  applyVisualEnhancements() {
    if (!this.ctx || !this.canvas || !this.visualEffects.enhanceColors) return;

    // This is a simplified version - in a real implementation, you would
    // use WebGL shaders or more complex image processing for true enhancement

    // Create a hidden canvas for processing
    const processingCanvas = document.createElement('canvas');
    processingCanvas.width = this.canvas.width;
    processingCanvas.height = this.canvas.height;
    const processingCtx = processingCanvas.getContext('2d');

    // Draw current canvas to processing canvas
    processingCtx.drawImage(this.canvas, 0, 0);

    // Get image data for processing
    let imageData;
    try {
      imageData = processingCtx.getImageData(0, 0, processingCanvas.width, processingCanvas.height);
      const data = imageData.data;

      // Apply simple color enhancement
      for (let i = 0; i < data.length; i += 4) {
        // Slightly increase saturation and contrast
        // This is a very simplified version of what TikTok does

        // Convert RGB to HSL
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;

        const max = Math.max(r, g, b);
        const min = Math.min(r, g, b);
        let h, s, l = (max + min) / 2;

        if (max === min) {
          h = s = 0; // achromatic
        } else {
          const d = max - min;
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
          }
          h /= 6;
        }

        // Adjust saturation and lightness
        s = Math.min(1, s * 1.2); // Increase saturation by 20%
        l = l * 0.95 + 0.05;     // Slight contrast boost

        // Convert back to RGB
        let r1, g1, b1;

        if (s === 0) {
          r1 = g1 = b1 = l; // achromatic
        } else {
          const hue2rgb = (p, q, t) => {
            if (t < 0) t += 1;
            if (t > 1) t -= 1;
            if (t < 1/6) return p + (q - p) * 6 * t;
            if (t < 1/2) return q;
            if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
            return p;
          };

          const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
          const p = 2 * l - q;

          r1 = hue2rgb(p, q, h + 1/3);
          g1 = hue2rgb(p, q, h);
          b1 = hue2rgb(p, q, h - 1/3);
        }

        // Set enhanced values
        data[i] = Math.round(r1 * 255);
        data[i + 1] = Math.round(g1 * 255);
        data[i + 2] = Math.round(b1 * 255);
      }

      // Put enhanced image data back
      processingCtx.putImageData(imageData, 0, 0);

      // Apply very slight blur for smoother appearance (TikTok-like smoothing)
      if (this.visualEffects.smoothTransitions) {
        this.ctx.filter = 'blur(0.5px)';
        this.ctx.drawImage(processingCanvas, 0, 0);
        this.ctx.filter = 'none';
      } else {
        this.ctx.drawImage(processingCanvas, 0, 0);
      }
    } catch (e) {
      console.error('Error applying visual enhancements:', e);
      // Fall back to original canvas if error occurs
    }
  }

  /**
   * Render active visual effects (like highlights, focus areas)
   */
  renderActiveEffects() {
    if (!this.effectsCtx) return;

    // Example: Add subtle glow/vignette effect around edges (TikTok-like polish)
    const ctx = this.effectsCtx;
    const width = this.effectsCanvas.width;
    const height = this.effectsCanvas.height;

    // Create radial gradient for vignette
    const gradient = ctx.createRadialGradient(
      width / 2, height / 2, Math.min(width, height) * 0.3, // Inner circle
      width / 2, height / 2, Math.max(width, height)        // Outer circle
    );
    gradient.addColorStop(0, 'rgba(0,0,0,0)');        // Transparent center
    gradient.addColorStop(1, 'rgba(0,0,0,0.15)');     // Slight dark edges

    // Apply gradient
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Play start animation
   */
  playStartAnimation() {
    if (!this.container) return;

    // Add transition class to container
    this.container.classList.add('tiktok-start-animation');

    // Remove class after animation completes
    setTimeout(() => {
      this.container.classList.remove('tiktok-start-animation');
    }, 500);
  }

  /**
   * Play pause animation
   */
  playPauseAnimation() {
    if (!this.effectsCtx || !this.effectsCanvas) return;

    // Draw pause icon in center that fades out
    const ctx = this.effectsCtx;
    const width = this.effectsCanvas.width;
    const height = this.effectsCanvas.height;

    // Draw semi-transparent background
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(0, 0, width, height);

    // Draw pause icon
    ctx.fillStyle = 'rgba(255,255,255,0.8)';
    ctx.fillRect(width/2 - 30, height/2 - 40, 20, 80);
    ctx.fillRect(width/2 + 10, height/2 - 40, 20, 80);

    // Fade out
    let opacity = 0.8;
    const fadeInterval = setInterval(() => {
      opacity -= 0.1;
      if (opacity <= 0) {
        clearInterval(fadeInterval);
        ctx.clearRect(0, 0, width, height);
      } else {
        ctx.clearRect(0, 0, width, height);
        ctx.fillStyle = `rgba(0,0,0,${opacity * 0.3})`;
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = `rgba(255,255,255,${opacity})`;
        ctx.fillRect(width/2 - 30, height/2 - 40, 20, 80);
        ctx.fillRect(width/2 + 10, height/2 - 40, 20, 80);
      }
    }, 50);
  }

  /**
   * Play seek animation
   */
  playSeekAnimation() {
    if (!this.container) return;

    // Add transition class
    this.container.classList.add('tiktok-seek-animation');

    // Remove class after animation completes
    setTimeout(() => {
      this.container.classList.remove('tiktok-seek-animation');
    }, 300);
  }

  /**
   * Start performance monitoring
   */
  startPerformanceMonitoring() {
    // Track FPS
    let frameCount = 0;
    let lastTime = performance.now();
    let fps = 0;

    const updateFPS = () => {
      const now = performance.now();
      frameCount++;

      // Update every second
      if (now - lastTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (now - lastTime));
        frameCount = 0;
        lastTime = now;

        // Adaptive quality based on performance
        this.adaptQualityToPerformance(fps);

        // Log FPS (would be displayed in UI in a real implementation)
        console.log(`TikTok-style rendering: ${fps} FPS`);
      }

      requestAnimationFrame(updateFPS);
    };

    requestAnimationFrame(updateFPS);
  }

  /**
   * Adapt quality settings based on performance
   * @param {Number} fps - Current frames per second
   */
  adaptQualityToPerformance(fps) {
    if (!this.performanceOptimization.adaptiveBitrate) return;

    // Adjust quality based on performance
    if (fps < 30) {
      // Low performance - reduce quality
      if (this.videoSettings.resolution !== 'standard') {
        console.log('Reducing quality due to performance');
        this.videoSettings.resolution = 'standard';
        this.setCanvasResolution(720);
      }
    } else if (fps > 55) {
      // High performance - can increase quality
      if (this.videoSettings.resolution === 'standard') {
        console.log('Increasing quality due to good performance');
        this.videoSettings.resolution = 'high';
        this.setCanvasResolution(1080);
      }
    }
  }

  /**
   * Clean up resources
   */
  destroy() {
    // Stop animation loop
    this.stopRenderLoop();

    // Remove event listeners
    window.removeEventListener('resize', this.handleResize.bind(this));

    // Remove effects canvas
    if (this.effectsCanvas && this.effectsCanvas.parentNode) {
      this.effectsCanvas.parentNode.removeChild(this.effectsCanvas);
    }

    console.log('TikTok-style enhancements destroyed');
  }
}

// Export the class
window.WhiteboardRecordingTikTokStyle = WhiteboardRecordingTikTokStyle;
