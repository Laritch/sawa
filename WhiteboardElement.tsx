import { useMemo, CSSProperties, MouseEvent } from 'react';
import { Element, ElementType } from './types';
import ModerationIndicator from './ModerationIndicator';
import useWhiteboardModeration from './hooks/useWhiteboardModeration';

interface WhiteboardElementProps {
  element: Element;
  selected?: boolean;
  onClick?: (event: MouseEvent<HTMLDivElement>) => void;
}

const WhiteboardElement = ({ element, selected = false, onClick }: WhiteboardElementProps) => {
  const { isElementVisible } = useWhiteboardModeration();

  // Element style based on its properties
  const style = useMemo((): CSSProperties => {
    const baseStyle: CSSProperties = {
      position: 'absolute',
      left: `${element.x}px`,
      top: `${element.y}px`,
      width: element.width ? `${element.width}px` : 'auto',
      height: element.height ? `${element.height}px` : 'auto',
      border: selected ? '2px dashed blue' : 'none',
      outline: selected ? '1px solid rgba(0, 0, 255, 0.5)' : 'none',
      backgroundColor: element.backgroundColor || 'transparent',
      color: element.strokeColor || '#000',
      fontSize: element.fontSize ? `${element.fontSize}px` : 'inherit',
      fontFamily: element.fontFamily || 'Arial',
      cursor: 'pointer',
      userSelect: 'none',
      zIndex: selected ? 2 : 1,
    };

    // Add rotation if present
    if (element.angle !== undefined) {
      baseStyle.transform = `rotate(${element.angle}deg)`;
    }

    // Add opacity if present
    if (element.opacity !== undefined) {
      baseStyle.opacity = element.opacity;
    }

    return baseStyle;
  }, [element, selected]);

  // Don't render if not visible based on moderation status
  if (!isElementVisible(element)) {
    return null;
  }

  // Render different types of elements
  const renderElement = () => {
    switch (element.type) {
      case ElementType.Text:
        return (
          <div
            style={{
              ...style,
              padding: '4px',
              minWidth: '20px',
              minHeight: '20px',
            }}
          >
            {element.text || ''}
          </div>
        );

      case ElementType.Rectangle:
        return (
          <div
            style={{
              ...style,
              border: `2px solid ${element.strokeColor || '#000'}`,
            }}
          />
        );

      case ElementType.Ellipse:
        return (
          <div
            style={{
              ...style,
              border: `2px solid ${element.strokeColor || '#000'}`,
              borderRadius: '50%',
            }}
          />
        );

      case ElementType.Line:
        // This is a simplified line representation
        return (
          <div
            style={{
              ...style,
              height: '2px',
              backgroundColor: element.strokeColor || '#000',
            }}
          />
        );

      case ElementType.Arrow:
        // SVG arrow implementation
        return (
          <div style={style}>
            <svg
              width={element.width || 100}
              height={element.height || 20}
              viewBox={`0 0 ${element.width || 100} ${element.height || 20}`}
            >
              <defs>
                <marker
                  id={`arrowhead-${element.id}`}
                  markerWidth="10"
                  markerHeight="7"
                  refX="9"
                  refY="3.5"
                  orient="auto"
                >
                  <polygon
                    points="0 0, 10 3.5, 0 7"
                    fill={element.strokeColor || '#000'}
                  />
                </marker>
              </defs>
              <line
                x1="0"
                y1={element.height ? element.height / 2 : 10}
                x2={element.width ? element.width - 10 : 90}
                y2={element.height ? element.height / 2 : 10}
                stroke={element.strokeColor || '#000'}
                strokeWidth="2"
                markerEnd={`url(#arrowhead-${element.id})`}
              />
            </svg>
          </div>
        );

      case ElementType.Pencil:
        // For simplicity, we'll render a line connecting all points
        if (element.points && element.points.length > 1) {
          const pathPoints = element.points.map(
            (point, index) => `${index === 0 ? 'M' : 'L'}${point.x},${point.y}`
          ).join(' ');

          return (
            <div style={style}>
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${element.width || 100} ${element.height || 100}`}
                overflow="visible"
              >
                <path
                  d={pathPoints}
                  stroke={element.strokeColor || '#000'}
                  strokeWidth="2"
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          );
        }
        // Fallback for simple points
        return (
          <div
            style={{
              ...style,
              width: '5px',
              height: '5px',
              borderRadius: '50%',
              backgroundColor: element.strokeColor || '#000',
            }}
          />
        );

      case ElementType.Freehand:
        // Render a freehand SVG path if we have path data
        if (element.path) {
          return (
            <div style={style}>
              <svg
                width="100%"
                height="100%"
                viewBox={`0 0 ${element.width || 100} ${element.height || 100}`}
                overflow="visible"
              >
                <path
                  d={element.path.d}
                  stroke={element.strokeColor || '#000'}
                  strokeWidth={element.path.strokeWidth}
                  fill="none"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                />
              </svg>
            </div>
          );
        }
        return null;

      case ElementType.Image:
        // Render an image element
        if (element.imageUrl || element.imageData) {
          return (
            <div style={style}>
              <img
                src={element.imageUrl || element.imageData}
                alt="Whiteboard image"
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                draggable={false}
              />
            </div>
          );
        }
        return (
          <div
            style={{
              ...style,
              border: '2px dashed #ccc',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#999',
              fontSize: '14px',
            }}
          >
            Image not found
          </div>
        );

      default:
        return <div style={style}>Unknown Element</div>;
    }
  };

  const handleClick = (e: MouseEvent<HTMLDivElement>) => {
    if (onClick) {
      onClick(e);
    }
  };

  return (
    <div
      className="relative group"
      style={{ position: 'absolute', left: 0, top: 0 }}
      onClick={handleClick}
    >
      {renderElement()}
      <ModerationIndicator element={element} position="top-right" showLabel />
    </div>
  );
};

export default WhiteboardElement;
