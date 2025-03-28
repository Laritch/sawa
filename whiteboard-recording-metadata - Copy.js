/**
 * WhiteboardRecordingMetadata
 * Handles metadata (categories, tags) for whiteboard recordings
 */
class WhiteboardRecordingMetadata {
  constructor(options = {}) {
    this.whiteboardManager = options.whiteboardManager;
    this.webinarId = options.webinarId;
    this.socket = options.socket;
    this.isHost = options.isHost || false;
    this.isPresenter = options.isPresenter || false;

    // Available categories
    this.categories = [
      { id: 'presentation', name: 'Presentation' },
      { id: 'brainstorming', name: 'Brainstorming' },
      { id: 'tutorial', name: 'Tutorial' },
      { id: 'meeting', name: 'Meeting' },
      { id: 'other', name: 'Other' }
    ];

    // Common tags that can be suggested
    this.suggestedTags = [
      'important', 'review', 'final', 'draft', 'meeting-notes',
      'decision', 'action-item', 'feature', 'bug', 'planning',
      'demo', 'feedback', 'training'
    ];

    this.initialize();
  }

  /**
   * Initialize metadata manager
   */
  initialize() {
    this.setupSocketListeners();
  }

  /**
   * Setup socket listeners for metadata events
   */
  setupSocketListeners() {
    if (!this.socket) return;

    // Listen for metadata updates
    this.socket.on('recording:metadata:updated', (data) => {
      // Show notification
      this.showNotification(
        'Recording metadata updated',
        'The recording title, category, or tags have been updated.'
      );

      // Trigger update event for UI
      document.dispatchEvent(new CustomEvent('recording:metadata:updated', {
        detail: data
      }));
    });
  }

  /**
   * Create UI for editing/viewing recording metadata
   * @param {Element} container - Container to create UI in
   * @param {Object} recording - Recording data
   * @param {String} whiteboardId - Whiteboard ID
   */
  createMetadataUI(container, recording, whiteboardId) {
    if (!container || !recording) return;

    this.currentRecording = recording;
    this.currentWhiteboardId = whiteboardId;

    // Create metadata section
    const metadataSection = document.createElement('div');
    metadataSection.className = 'recording-metadata';

    // Create title section
    const titleSection = document.createElement('div');
    titleSection.className = 'recording-title-section';
    titleSection.innerHTML = `
      <h3>${recording.title || 'Untitled Recording'}</h3>
      ${this.canEdit() ? `<button class="edit-title-button"><i class="fas fa-pencil-alt"></i></button>` : ''}
    `;

    // Create category section
    const categorySection = document.createElement('div');
    categorySection.className = 'recording-category-section';

    const categoryName = this.getCategoryName(recording.category);
    categorySection.innerHTML = `
      <div class="recording-metadata-field">
        <span class="metadata-label">Category:</span>
        <span class="recording-category">${categoryName}</span>
        ${this.canEdit() ? `<button class="edit-category-button"><i class="fas fa-pencil-alt"></i></button>` : ''}
      </div>
    `;

    // Create tags section
    const tagsSection = document.createElement('div');
    tagsSection.className = 'recording-tags-section';

    // Display tags or "No tags" message
    const tagsHtml = recording.tags && recording.tags.length > 0
      ? `<div class="recording-tags">
          ${recording.tags.map(tag => `<span class="recording-tag">${tag}</span>`).join('')}
        </div>`
      : '<span class="no-tags">No tags</span>';

    tagsSection.innerHTML = `
      <div class="recording-metadata-field">
        <span class="metadata-label">Tags:</span>
        ${tagsHtml}
        ${this.canEdit() ? `<button class="edit-tags-button"><i class="fas fa-pencil-alt"></i></button>` : ''}
      </div>
    `;

    // Add components to container
    metadataSection.appendChild(titleSection);
    metadataSection.appendChild(categorySection);
    metadataSection.appendChild(tagsSection);
    container.appendChild(metadataSection);

    // Add event listeners for edit buttons if user can edit
    if (this.canEdit()) {
      titleSection.querySelector('.edit-title-button')?.addEventListener('click', () => {
        this.showTitleEditDialog(recording);
      });

      categorySection.querySelector('.edit-category-button')?.addEventListener('click', () => {
        this.showCategoryEditDialog(recording);
      });

      tagsSection.querySelector('.edit-tags-button')?.addEventListener('click', () => {
        this.showTagsEditDialog(recording);
      });
    }

    // Listen for metadata updates
    document.addEventListener('recording:metadata:updated', (event) => {
      const data = event.detail;

      // Check if update is for current recording
      if (data.recordingId === recording._id) {
        // Update UI with new metadata
        if (data.metadata.title) {
          titleSection.querySelector('h3').textContent = data.metadata.title;
          this.currentRecording.title = data.metadata.title;
        }

        if (data.metadata.category) {
          categorySection.querySelector('.recording-category').textContent =
            this.getCategoryName(data.metadata.category);
          this.currentRecording.category = data.metadata.category;
        }

        if (data.metadata.tags) {
          const tagsContainer = tagsSection.querySelector('.recording-tags')
            || document.createElement('div');

          tagsContainer.className = 'recording-tags';

          if (data.metadata.tags.length > 0) {
            tagsContainer.innerHTML = data.metadata.tags
              .map(tag => `<span class="recording-tag">${tag}</span>`)
              .join('');

            // Replace "No tags" message if it exists
            const noTags = tagsSection.querySelector('.no-tags');
            if (noTags) {
              tagsSection.querySelector('.recording-metadata-field').replaceChild(
                tagsContainer, noTags
              );
            }
          } else {
            // Show "No tags" message
            tagsSection.querySelector('.recording-metadata-field').innerHTML = `
              <span class="metadata-label">Tags:</span>
              <span class="no-tags">No tags</span>
              ${this.canEdit() ? `<button class="edit-tags-button"><i class="fas fa-pencil-alt"></i></button>` : ''}
            `;

            // Re-add event listener
            if (this.canEdit()) {
              tagsSection.querySelector('.edit-tags-button')?.addEventListener('click', () => {
                this.showTagsEditDialog(this.currentRecording);
              });
            }
          }

          this.currentRecording.tags = data.metadata.tags;
        }
      }
    });
  }

  /**
   * Show dialog to edit recording title
   * @param {Object} recording - Recording to edit
   */
  showTitleEditDialog(recording) {
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'edit-tags-dialog';
    dialog.innerHTML = `
      <div class="edit-tags-dialog-content">
        <h3>Edit Recording Title</h3>
        <input type="text" id="recording-title-input" value="${recording.title || ''}" placeholder="Enter recording title" style="width: 100%; padding: 8px; margin-bottom: 20px;">
        <div class="share-dialog-footer">
          <button class="share-dialog-btn secondary cancel-btn">Cancel</button>
          <button class="share-dialog-btn primary save-btn">Save</button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(dialog);

    // Focus title input
    setTimeout(() => {
      dialog.querySelector('#recording-title-input').focus();
    }, 100);

    // Cancel button
    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    // Save button
    dialog.querySelector('.save-btn').addEventListener('click', () => {
      const title = dialog.querySelector('#recording-title-input').value.trim();
      if (title) {
        this.updateRecordingMetadata({
          title
        });
        document.body.removeChild(dialog);
      } else {
        alert('Please enter a title');
      }
    });
  }

  /**
   * Show dialog to edit recording category
   * @param {Object} recording - Recording to edit
   */
  showCategoryEditDialog(recording) {
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'edit-tags-dialog';
    dialog.innerHTML = `
      <div class="edit-tags-dialog-content">
        <h3>Edit Recording Category</h3>
        <select id="recording-category-select" class="category-select">
          ${this.categories.map(category =>
            `<option value="${category.id}" ${recording.category === category.id ? 'selected' : ''}>${category.name}</option>`
          ).join('')}
        </select>
        <div class="share-dialog-footer">
          <button class="share-dialog-btn secondary cancel-btn">Cancel</button>
          <button class="share-dialog-btn primary save-btn">Save</button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(dialog);

    // Cancel button
    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    // Save button
    dialog.querySelector('.save-btn').addEventListener('click', () => {
      const category = dialog.querySelector('#recording-category-select').value;
      this.updateRecordingMetadata({
        category
      });
      document.body.removeChild(dialog);
    });
  }

  /**
   * Show dialog to edit recording tags
   * @param {Object} recording - Recording to edit
   */
  showTagsEditDialog(recording) {
    // Create dialog
    const dialog = document.createElement('div');
    dialog.className = 'edit-tags-dialog';

    // Get current tags
    const currentTags = recording.tags || [];

    dialog.innerHTML = `
      <div class="edit-tags-dialog-content">
        <h3>Edit Recording Tags</h3>
        <div class="tags-input" id="tags-input">
          ${currentTags.map(tag => `
            <div class="tag-chip" data-tag="${tag}">
              ${tag}
              <span class="remove-tag">&times;</span>
            </div>
          `).join('')}
          <input type="text" class="tag-input" placeholder="Add tags...">
        </div>
        <div class="suggested-tags">
          <span class="metadata-label">Suggested tags:</span>
          <div class="recording-tags">
            ${this.suggestedTags.map(tag =>
              `<span class="recording-tag suggested-tag" data-tag="${tag}">${tag}</span>`
            ).join('')}
          </div>
        </div>
        <div class="share-dialog-footer">
          <button class="share-dialog-btn secondary cancel-btn">Cancel</button>
          <button class="share-dialog-btn primary save-btn">Save</button>
        </div>
      </div>
    `;

    // Add to document
    document.body.appendChild(dialog);

    // Get tags input elements
    const tagsInput = dialog.querySelector('#tags-input');
    const tagInput = dialog.querySelector('.tag-input');

    // Focus tag input
    setTimeout(() => {
      tagInput.focus();
    }, 100);

    // Function to add a tag
    const addTag = (tag) => {
      tag = tag.trim().toLowerCase();

      // Skip if tag is empty or already exists
      if (!tag || dialog.querySelectorAll(`.tag-chip[data-tag="${tag}"]`).length > 0) {
        return;
      }

      // Create tag chip
      const tagChip = document.createElement('div');
      tagChip.className = 'tag-chip';
      tagChip.dataset.tag = tag;
      tagChip.innerHTML = `
        ${tag}
        <span class="remove-tag">&times;</span>
      `;

      // Add tag chip before input
      tagsInput.insertBefore(tagChip, tagInput);

      // Clear input
      tagInput.value = '';

      // Add event listener to remove button
      tagChip.querySelector('.remove-tag').addEventListener('click', () => {
        tagsInput.removeChild(tagChip);
      });
    };

    // Add event listener to remove buttons
    dialog.querySelectorAll('.remove-tag').forEach(button => {
      button.addEventListener('click', () => {
        const tagChip = button.parentElement;
        tagsInput.removeChild(tagChip);
      });
    });

    // Add event listener to input
    tagInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ',') {
        e.preventDefault();
        addTag(tagInput.value);
      }
    });

    // Add event listener to suggested tags
    dialog.querySelectorAll('.suggested-tag').forEach(tag => {
      tag.addEventListener('click', () => {
        addTag(tag.dataset.tag);
      });
    });

    // Cancel button
    dialog.querySelector('.cancel-btn').addEventListener('click', () => {
      document.body.removeChild(dialog);
    });

    // Save button
    dialog.querySelector('.save-btn').addEventListener('click', () => {
      // Get all tags
      const tags = Array.from(dialog.querySelectorAll('.tag-chip'))
        .map(chip => chip.dataset.tag);

      // Add tag from input if not empty
      const inputTag = tagInput.value.trim();
      if (inputTag) {
        tags.push(inputTag);
      }

      // Update recording metadata
      this.updateRecordingMetadata({
        tags
      });

      document.body.removeChild(dialog);
    });
  }

  /**
   * Update recording metadata
   * @param {Object} metadata - Metadata to update
   */
  updateRecordingMetadata(metadata) {
    if (!this.currentRecording || !this.currentWhiteboardId) {
      console.error('No recording selected');
      return;
    }

    // Check if user can edit
    if (!this.canEdit()) {
      this.showNotification('Permission denied', 'You do not have permission to edit this recording.', 'error');
      return;
    }

    // Make API call to update metadata
    fetch(`/api/webinars/${this.webinarId}/whiteboards/${this.currentWhiteboardId}/recordings/${this.currentRecording._id}/metadata`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(metadata)
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        this.showNotification('Metadata updated', 'Recording metadata has been updated successfully.');
      } else {
        this.showNotification('Update failed', data.message || 'An error occurred while updating metadata.', 'error');
      }
    })
    .catch(error => {
      console.error('Error updating metadata:', error);
      this.showNotification('Update failed', 'An error occurred while updating metadata.', 'error');
    });
  }

  /**
   * Check if the current user can edit the recording
   * @returns {Boolean} - Whether user can edit
   */
  canEdit() {
    return this.isHost || this.isPresenter;
  }

  /**
   * Get category name from ID
   * @param {String} categoryId - Category ID
   * @returns {String} - Category name
   */
  getCategoryName(categoryId) {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Other';
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
