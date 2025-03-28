import { useRef, useState, useEffect } from 'react';
import useWhiteboardStore from './store/useWhiteboardStore';
import WhiteboardElement from './WhiteboardElement';
import RemoteCursor from './RemoteCursor';
import WhiteboardToolbar from './WhiteboardToolbar';
import { WhiteboardProvider, useWhiteboardContext } from './WhiteboardContext';
import WhiteboardStoreBridge from './WhiteboardStoreBridge';
import { ElementType, Point, PathData } from './types';

interface WhiteboardProps {
  width?: number;
  height?: number;
  userId: string;
  toolbarPosition?: 'top' | 'bottom' | 'left' | 'right';
  onSave?: (imageUrl: string) => void;
  showModerationPanel?: string; // Using string to avoid HTML boolean attribute issues
  showCollaborationPanel?: string;
  showChatPanel?: string;
  onChatMessage?: (message: string) => void;
}

const WhiteboardCanvas = ({
  width = 800,
  height = 600,
  userId,
  toolbarPosition = 'top',
  onSave,
  showModerationPanel = "false",
  showCollaborationPanel = "false",
  showChatPanel = "false",
  onChatMessage
}: WhiteboardProps) => {
  const {
    elements,
    tool,
    strokeColor,
    backgroundColor,
    fontSize,
    fontFamily,
    roughness,
    selectedElement,
    remoteCursors,
    collaborationConfig,
    setSelectedElement,
    addElement,
    updateElement,
