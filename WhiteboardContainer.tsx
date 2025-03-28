import React, { useState } from 'react';
import Whiteboard from './Whiteboard';
import { nanoid } from 'nanoid';

interface WhiteboardContainerProps {
  width?: number;
  height?: number;
  userName?: string;
  title?: string;
  toolbarPosition?: 'top' | 'bottom' | 'left' | 'right';
  onSave?: (imageUrl: string) => void;
  showModerationPanel?: boolean;
  showCollaborationPanel?: boolean;
  showChatPanel?: boolean;
  onChatMessage?: (message: string) => void;
}

/**
 * Container component for the Whiteboard that handles user session and displays the whiteboard
 * with all its tools, including the template gallery.
 */
const WhiteboardContainer: React.FC<WhiteboardContainerProps> = ({
  width = 1000,
  height = 700,
  userName = `User-${nanoid().substring(0, 5)}`,
  title,
  toolbarPosition = 'top',
  onSave,
  showModerationPanel = false,
  showCollaborationPanel = false,
  showChatPanel = false,
  onChatMessage,
}) => {
  // Generate a unique user ID for this session
  const [userId] = useState(nanoid());

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '20px',
    maxWidth: '100%',
    overflow: 'hidden',
  };

  const titleStyle: React.CSSProperties = title ? {
    fontSize: '1.25rem',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#1f2937',
  } : { display: 'none' };

  return (
    <div style={containerStyle}>
      {title && <h2 style={titleStyle}>{title}</h2>}
      <Whiteboard
        width={width}
        height={height}
        userId={userId}
        toolbarPosition={toolbarPosition}
        onSave={onSave}
        // Convert boolean props to strings for HTML attributes
        showModerationPanel={showModerationPanel ? "true" : "false"}
        showCollaborationPanel={showCollaborationPanel ? "true" : "false"}
        showChatPanel={showChatPanel ? "true" : "false"}
        onChatMessage={onChatMessage}
      />
    </div>
  );
};

export default WhiteboardContainer;
