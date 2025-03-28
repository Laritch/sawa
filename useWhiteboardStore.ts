import { create } from 'zustand';
import { nanoid } from 'nanoid';
import { Element, ElementType, ModerationConfig, ModerationStatus, Point } from '../types';
import { moderationService } from '../services/moderationService';
import { socketService, SocketEvents, CursorPosition, UserInfo } from '../services/socketService';
import createDemoElements from '../utils/demoElements';

// Interface for remote cursor positions
interface RemoteCursors {
  [userId: string]: {
    x: number;
    y: number;
    tool: ElementType;
    userInfo: UserInfo;
    timestamp: number;
  };
}

interface CollaborationConfig {
  enabled: boolean;
  serverUrl: string;
  roomId: string | null;
  isConnected: boolean;
  isConnecting: boolean;
}

interface WhiteboardState {
  elements: Element[];
  selectedElement: Element | null;
  history: Element[][];
  historyIndex: number;
  isDrawing: boolean;
  tool: ElementType;
  strokeColor: string;
  backgroundColor: string;
  fontSize: number;
  fontFamily: string;
  roughness: number;
  userId: string;
  userInfo: UserInfo;
  moderationConfig: ModerationConfig;
  flaggedElements: Element[];
  remoteCursors: RemoteCursors;
  collaborationConfig: CollaborationConfig;

  // Actions
  addElement: (element: Omit<Element, 'id' | 'createdAt' | 'updatedAt' | 'createdBy' | 'moderationStatus'>) => Promise<Element>;
  updateElement: (id: string, updates: Partial<Element>) => Promise<void>;
  deleteElement: (id: string) => void;
  setSelectedElement: (element: Element | null) => void;
  setTool: (tool: ElementType) => void;
  setStrokeColor: (color: string) => void;
  setBackgroundColor: (color: string) => void;
  setFontSize: (size: number) => void;
  setFontFamily: (family: string) => void;
  setRoughness: (roughness: number) => void;
  undo: () => void;
  redo: () => void;
  clearWhiteboard: () => void;
  updateModerationConfig: (config: Partial<ModerationConfig>) => void;
  moderateElement: (elementId: string) => Promise<Element>;
  reviewFlaggedElement: (elementId: string, approved: boolean) => void;

  // Collaboration actions
  updateCollaborationConfig: (config: Partial<CollaborationConfig>) => void;
  connectToCollabServer: (serverUrl: string, roomId: string, userName: string, isExpert?: boolean) => Promise<void>;
  disconnectFromCollabServer: () => void;
  updateCursorPosition: (x: number, y: number) => void;
  addRemoteElement: (element: Element) => void;
  updateRemoteElement: (elementId: string, updates: Partial<Element>) => void;
  deleteRemoteElement: (elementId: string) => void;
  clearRemoteWhiteboard: () => void;
  handleRemoteCursorPosition: (cursorPosition: CursorPosition, userInfo: UserInfo) => void;
}

// Default moderation configuration
const DEFAULT_MODERATION_CONFIG: ModerationConfig = {
  enabled: true,
  autoModerate: true,
  blockRejected: true,
  sensitivity: 75,
  moderateText: true,
  moderateDrawings: true,
  notifyOnFlag: true,
};

// Default collaboration configuration
const DEFAULT_COLLABORATION_CONFIG: CollaborationConfig = {
  enabled: false,
  serverUrl: '',
  roomId: null,
  isConnected: false,
  isConnecting: false,
};

// Generate random color for user
const generateUserColor = (): string => {
  const colors = [
    '#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#33FFF5',
    '#F533FF', '#FF8C33', '#33FF8C', '#8C33FF', '#FFF533'
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

const useWhiteboardStore = create<WhiteboardState>((set, get) => {
  // Create a unique user ID and info for this session
  const userId = nanoid();
  const userInfo: UserInfo = {
    id: userId,
    name: `User-${userId.substring(0, 5)}`,
    color: generateUserColor(),
  };

  // Generate demo elements
  const demoElements = createDemoElements(userId);

  // Initialize the store with demo elements
  return {
    elements: demoElements,
    selectedElement: null,
    history: [demoElements],
    historyIndex: 0,
    isDrawing: false,
    tool: ElementType.Pencil,
    strokeColor: '#000000',
    backgroundColor: 'transparent',
    fontSize: 18,
    fontFamily: 'Arial',
    roughness: 1,
    userId,
    userInfo,
    moderationConfig: DEFAULT_MODERATION_CONFIG,
    flaggedElements: demoElements.filter(el => el.moderationStatus === ModerationStatus.Flagged),
    remoteCursors: {},
    collaborationConfig: DEFAULT_COLLABORATION_CONFIG,

    // Add a new element with automatic moderation
    addElement: async (elementData) => {
      const { userId, moderationConfig, collaborationConfig } = get();

      // Create the new element with pending moderation status
      const newElement: Element = {
        id: nanoid(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        moderationStatus: ModerationStatus.Pending,
        ...elementData,
      };

      // Update state immediately with pending status
      set((state) => ({
        elements: [...state.elements, newElement],
        history: [...state.history.slice(0, state.historyIndex + 1), [...state.elements, newElement]],
        historyIndex: state.historyIndex + 1,
      }));

      // If collaboration is enabled, emit the new element
      if (collaborationConfig.enabled && collaborationConfig.isConnected) {
        socketService.sendAddElement(newElement);
      }

      // If moderation is enabled, check the element
      if (moderationConfig.enabled && moderationConfig.autoModerate) {
        return await get().moderateElement(newElement.id);
      }

      return newElement;
    },

    // Update an existing element
    updateElement: async (id, updates) => {
      const { elements, moderationConfig, collaborationConfig } = get();
      const elementIndex = elements.findIndex(el => el.id === id);

      if (elementIndex === -1) return;

      const updatedElement = {
        ...elements[elementIndex],
        ...updates,
        updatedAt: Date.now(),
      };

      // Update element in state
      set((state) => {
        const newElements = [...state.elements];
        newElements[elementIndex] = updatedElement;

        return {
          elements: newElements,
          history: [...state.history.slice(0, state.historyIndex + 1), newElements],
          historyIndex: state.historyIndex + 1,
        };
      });

      // If collaboration is enabled, emit the updated element
      if (collaborationConfig.enabled && collaborationConfig.isConnected) {
        socketService.sendUpdateElement(id, updates);
      }

      // If content changed and moderation is enabled, re-moderate the element
      const contentUpdated = updates.text !== undefined || updates.points !== undefined;
      if (contentUpdated && moderationConfig.enabled && moderationConfig.autoModerate) {
        await get().moderateElement(id);
      }
    },

    // Delete an element
    deleteElement: (id) => {
      const { collaborationConfig } = get();

      set((state) => {
        const filteredElements = state.elements.filter(el => el.id !== id);
        return {
          elements: filteredElements,
          selectedElement: state.selectedElement?.id === id ? null : state.selectedElement,
          history: [...state.history.slice(0, state.historyIndex + 1), filteredElements],
          historyIndex: state.historyIndex + 1,
        };
      });

      // If collaboration is enabled, emit the delete element event
      if (collaborationConfig.enabled && collaborationConfig.isConnected) {
        socketService.sendDeleteElement(id);
      }
    },

    // Set the selected element
    setSelectedElement: (element) => {
      set({ selectedElement: element });
    },

    // Set the active tool
    setTool: (tool) => {
      set({ tool });
    },

    // Set the stroke color
    setStrokeColor: (color) => {
      set({ strokeColor: color });
    },

    // Set the background color
    setBackgroundColor: (color) => {
      set({ backgroundColor: color });
    },

    // Set the font size
    setFontSize: (size) => {
      set({ fontSize: size });
    },

    // Set the font family
    setFontFamily: (family) => {
      set({ fontFamily: family });
    },

    // Set the roughness
    setRoughness: (roughness) => {
      set({ roughness: roughness });
    },

    // Undo the last action
    undo: () => {
      const { collaborationConfig } = get();

      set((state) => {
        if (state.historyIndex > 0) {
          const newElements = [...state.history[state.historyIndex - 1]];

          // If collaboration is enabled, sync the new state
          if (collaborationConfig.enabled && collaborationConfig.isConnected) {
            socketService.sendClearWhiteboard();
            newElements.forEach(element => {
              socketService.sendAddElement(element);
            });
          }

          return {
            historyIndex: state.historyIndex - 1,
            elements: newElements,
          };
        }
        return state;
      });
    },

    // Redo the last undone action
    redo: () => {
      const { collaborationConfig } = get();

      set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          const newElements = [...state.history[state.historyIndex + 1]];

          // If collaboration is enabled, sync the new state
          if (collaborationConfig.enabled && collaborationConfig.isConnected) {
            socketService.sendClearWhiteboard();
            newElements.forEach(element => {
              socketService.sendAddElement(element);
            });
          }

          return {
            historyIndex: state.historyIndex + 1,
            elements: newElements,
          };
        }
        return state;
      });
    },

    // Clear the whiteboard
    clearWhiteboard: () => {
      const { collaborationConfig } = get();

      set((state) => ({
        elements: [],
        selectedElement: null,
        history: [...state.history.slice(0, state.historyIndex + 1), []],
        historyIndex: state.historyIndex + 1,
      }));

      // If collaboration is enabled, emit the clear whiteboard event
      if (collaborationConfig.enabled && collaborationConfig.isConnected) {
        socketService.sendClearWhiteboard();
      }
    },

    // Update moderation configuration
    updateModerationConfig: (config) => {
      set((state) => ({
        moderationConfig: {
          ...state.moderationConfig,
          ...config,
        },
      }));

      // Update the moderation service sensitivity
      if (config.sensitivity !== undefined) {
        moderationService.configure({
          sensitivity: config.sensitivity,
        });
      }
    },

    // Moderate a specific element
    moderateElement: async (elementId) => {
      const { elements, moderationConfig } = get();
      const elementIndex = elements.findIndex(el => el.id === elementId);

      if (elementIndex === -1) {
        throw new Error(`Element with ID ${elementId} not found`);
      }

      const element = elements[elementIndex];

      // Skip moderation if disabled or not applicable for this element type
      if (!moderationConfig.enabled ||
          (element.type === ElementType.Text && !moderationConfig.moderateText) ||
          (element.type !== ElementType.Text && !moderationConfig.moderateDrawings)) {
        // Automatically approve if moderation is disabled for this type
        set((state) => {
          const newElements = [...state.elements];
          newElements[elementIndex] = {
            ...newElements[elementIndex],
            moderationStatus: ModerationStatus.Approved,
          };
          return { elements: newElements };
        });
        return elements[elementIndex];
      }

      try {
        // Call moderation service
        const result = await moderationService.moderateElement(element);

        // Update element with moderation result
        set((state) => {
          const newElements = [...state.elements];
          newElements[elementIndex] = {
            ...newElements[elementIndex],
            moderationStatus: result.status,
            moderationReason: result.reason,
          };

          // Add to flagged elements if flagged or rejected
          let newFlaggedElements = [...state.flaggedElements];
          if (result.status === ModerationStatus.Flagged ||
              result.status === ModerationStatus.Rejected) {
            if (!newFlaggedElements.some(el => el.id === element.id)) {
              newFlaggedElements.push(newElements[elementIndex]);
            }
          } else {
            // Remove from flagged if approved
            newFlaggedElements = newFlaggedElements.filter(el => el.id !== element.id);
          }

          return {
            elements: newElements,
            flaggedElements: newFlaggedElements,
          };
        });

        return {
          ...element,
          moderationStatus: result.status,
          moderationReason: result.reason,
        };
      } catch (error) {
        console.error('Error during moderation:', error);

        // Set to pending if moderation fails
        set((state) => {
          const newElements = [...state.elements];
          newElements[elementIndex] = {
            ...newElements[elementIndex],
            moderationStatus: ModerationStatus.Pending,
          };
          return { elements: newElements };
        });

        return element;
      }
    },

    // Review a flagged element (approve or reject)
    reviewFlaggedElement: (elementId, approved) => {
      set((state) => {
        const elementIndex = state.elements.findIndex(el => el.id === elementId);
        if (elementIndex === -1) return state;

        const newElements = [...state.elements];
        newElements[elementIndex] = {
          ...newElements[elementIndex],
          moderationStatus: approved ? ModerationStatus.Approved : ModerationStatus.Rejected,
        };

        return {
          elements: newElements,
          flaggedElements: state.flaggedElements.filter(el => el.id !== elementId),
        };
      });
    },

    // Update collaboration configuration
    updateCollaborationConfig: (config) => {
      set((state) => ({
        collaborationConfig: {
          ...state.collaborationConfig,
          ...config,
        },
      }));
    },

    // Connect to collaboration server
    connectToCollabServer: async (serverUrl, roomId, userName, isExpert = false) => {
      const { userId, userInfo } = get();

      // Update user info with the provided name and expert status
      const updatedUserInfo: UserInfo = {
        ...userInfo,
        name: userName,
        isExpert,
      };

      // Update state to show connecting status
      set((state) => ({
        collaborationConfig: {
          ...state.collaborationConfig,
          isConnecting: true,
          serverUrl,
          roomId,
        },
        userInfo: updatedUserInfo,
      }));

      try {
        // Initialize socket connection
        await socketService.initialize(serverUrl);

        // Join room
        socketService.joinRoom(roomId, updatedUserInfo);

        // Set up event listeners
        socketService.on(SocketEvents.ADD_ELEMENT, (data) => {
          if (data.element.createdBy !== userId) {
            get().addRemoteElement(data.element);
          }
        });

        socketService.on(SocketEvents.UPDATE_ELEMENT, (data) => {
          get().updateRemoteElement(data.elementId, data.updates);
        });

        socketService.on(SocketEvents.DELETE_ELEMENT, (data) => {
          get().deleteRemoteElement(data.elementId);
        });

        socketService.on(SocketEvents.CLEAR_WHITEBOARD, () => {
          get().clearRemoteWhiteboard();
        });

        socketService.on(SocketEvents.CURSOR_POSITION, (data) => {
          if (data.position.userId !== userId) {
            // Find the user info from the room
            const userInfo = data.userInfo || {
              id: data.position.userId,
              name: `User-${data.position.userId.substring(0, 5)}`,
              color: '#FF0000',
            };

            get().handleRemoteCursorPosition(data.position, userInfo);
          }
        });

        // Request initial state sync
        socketService.requestSync();

        // Update connection status
        set((state) => ({
          collaborationConfig: {
            ...state.collaborationConfig,
            isConnected: true,
            isConnecting: false,
            enabled: true,
          },
        }));
      } catch (error) {
        console.error('Failed to connect to collaboration server:', error);

        // Reset connection status on error
        set((state) => ({
          collaborationConfig: {
            ...state.collaborationConfig,
            isConnected: false,
            isConnecting: false,
          },
        }));

        throw error;
      }
    },

    // Disconnect from collaboration server
    disconnectFromCollabServer: () => {
      socketService.cleanup();

      set((state) => ({
        collaborationConfig: {
          ...state.collaborationConfig,
          isConnected: false,
          enabled: false,
        },
        remoteCursors: {},
      }));
    },

    // Update cursor position and send to other users
    updateCursorPosition: (x, y) => {
      const { tool, collaborationConfig } = get();

      if (collaborationConfig.enabled && collaborationConfig.isConnected) {
        socketService.sendCursorPosition(x, y, tool);
      }
    },

    // Add element received from other users
    addRemoteElement: (element) => {
      // Don't add duplicate elements
      const { elements } = get();
      if (elements.some(el => el.id === element.id)) {
        return;
      }

      set((state) => ({
        elements: [...state.elements, element],
        history: [...state.history.slice(0, state.historyIndex + 1), [...state.elements, element]],
        historyIndex: state.historyIndex + 1,
      }));
    },

    // Update element based on updates from other users
    updateRemoteElement: (elementId, updates) => {
      const { elements } = get();
      const elementIndex = elements.findIndex(el => el.id === elementId);

      if (elementIndex === -1) return;

      set((state) => {
        const newElements = [...state.elements];
        newElements[elementIndex] = {
          ...newElements[elementIndex],
          ...updates,
          updatedAt: Date.now(),
        };

        return {
          elements: newElements,
          history: [...state.history.slice(0, state.historyIndex + 1), newElements],
          historyIndex: state.historyIndex + 1,
        };
      });
    },

    // Delete element based on request from other users
    deleteRemoteElement: (elementId) => {
      set((state) => {
        const filteredElements = state.elements.filter(el => el.id !== elementId);
        return {
          elements: filteredElements,
          selectedElement: state.selectedElement?.id === elementId ? null : state.selectedElement,
          history: [...state.history.slice(0, state.historyIndex + 1), filteredElements],
          historyIndex: state.historyIndex + 1,
        };
      });
    },

    // Clear whiteboard based on request from other users
    clearRemoteWhiteboard: () => {
      set((state) => ({
        elements: [],
        selectedElement: null,
        history: [...state.history.slice(0, state.historyIndex + 1), []],
        historyIndex: state.historyIndex + 1,
      }));
    },

    // Handle cursor position updates from other users
    handleRemoteCursorPosition: (cursorPosition, userInfo) => {
      set((state) => {
        const newRemoteCursors = { ...state.remoteCursors };

        // Update or add cursor position with user info
        newRemoteCursors[cursorPosition.userId] = {
          x: cursorPosition.x,
          y: cursorPosition.y,
          tool: cursorPosition.tool,
          userInfo,
          timestamp: Date.now(),
        };

        return { remoteCursors: newRemoteCursors };
      });

      // Clean up old cursors (cursors that haven't been updated in 5 seconds)
      setTimeout(() => {
        set((state) => {
          const now = Date.now();
          const newRemoteCursors = { ...state.remoteCursors };

          Object.keys(newRemoteCursors).forEach(userId => {
            if (now - newRemoteCursors[userId].timestamp > 5000) {
              delete newRemoteCursors[userId];
            }
          });

          return { remoteCursors: newRemoteCursors };
        });
      }, 5000);
    },
  };
});

export default useWhiteboardStore;
