import { useState } from 'react';
import { ElementType } from './types';
import useWhiteboardStore from './store/useWhiteboardStore';
import ImageUploader from './ImageUploader';
import { TemplateGallery } from './TemplateGallery';

interface WhiteboardToolbarProps {
  position?: 'top' | 'bottom' | 'left' | 'right';
  userId: string;
}

/**
 * Toolbar component for the whiteboard with drawing tools, colors, and actions
 */
const WhiteboardToolbar = ({ position = 'top', userId }: WhiteboardToolbarProps) => {
  const {
    tool,
    strokeColor,
    backgroundColor,
    fontSize,
    roughness,
    elements,
    clearWhiteboard,
    setTool,
    setStrokeColor,
    setBackgroundColor,
    setFontSize,
    setRoughness,
    undo,
    redo,
  } = useWhiteboardStore();

  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const [isBgColorPickerOpen, setIsBgColorPickerOpen] = useState(false);
  const [showImageUploader, setShowImageUploader] = useState(false);
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  // Predefined colors
  const colors = [
    '#000000',
    '#FF0000',
    '#00FF00',
    '#0000FF',
    '#FFFF00',
    '#FF00FF',
    '#00FFFF',
    '#FFFFFF',
    '#FFA500', // Orange
    '#800080', // Purple
    '#A52A2A', // Brown
    '#008080', // Teal
  ];

  // Available font sizes
  const fontSizes = [12, 14, 16, 18, 20, 24, 28, 32, 36, 48];

  // Available roughness values
  const roughnessValues = [
    { value: 0, label: 'Smooth' },
    { value: 1, label: 'Normal' },
    { value: 2, label: 'Rough' },
  ];

  // Container classes based on position
  const getContainerClasses = () => {
    switch (position) {
      case 'top':
        return 'flex flex-row justify-center items-center w-full py-2 px-4 mb-2';
      case 'bottom':
        return 'flex flex-row justify-center items-center w-full py-2 px-4 mt-2';
      case 'left':
        return 'flex flex-col justify-start items-center h-full py-4 px-2 mr-2';
      case 'right':
        return 'flex flex-col justify-start items-center h-full py-4 px-2 ml-2';
      default:
        return 'flex flex-row justify-center items-center w-full py-2 px-4 mb-2';
    }
  };

  // Determine if horizontal or vertical layout
  const isHorizontal = position === 'top' || position === 'bottom';

  // Get tool icon
  const getToolIcon = (toolType: ElementType) => {
    switch (toolType) {
      case ElementType.Pencil:
        return '✏️';
      case ElementType.Line:
        return '⟋';
      case ElementType.Rectangle:
        return '□';
      case ElementType.Ellipse:
        return '○';
      case ElementType.Text:
        return 'T';
      case ElementType.Freehand:
        return '✎';
      case ElementType.Arrow:
        return '→';
      case ElementType.Image:
        return '🖼️';
      default:
        return '✏️';
    }
  };

  return (
    <>
      <div className={`bg-gray-100 rounded shadow ${getContainerClasses()}`}>
        {/* Drawing Tools */}
        <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} space-${isHorizontal ? 'x' : 'y'}-2 mr-4`}>
          <button
            className={`p-2 rounded ${tool === ElementType.Pencil ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTool(ElementType.Pencil)}
            title="Pencil Tool"
          >
            {getToolIcon(ElementType.Pencil)}
          </button>
          <button
            className={`p-2 rounded ${tool === ElementType.Freehand ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTool(ElementType.Freehand)}
            title="Freehand Tool"
          >
            {getToolIcon(ElementType.Freehand)}
          </button>
          <button
            className={`p-2 rounded ${tool === ElementType.Line ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTool(ElementType.Line)}
            title="Line Tool"
          >
            {getToolIcon(ElementType.Line)}
          </button>
          <button
            className={`p-2 rounded ${tool === ElementType.Arrow ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTool(ElementType.Arrow)}
            title="Arrow Tool"
          >
            {getToolIcon(ElementType.Arrow)}
          </button>
          <button
            className={`p-2 rounded ${tool === ElementType.Rectangle ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTool(ElementType.Rectangle)}
            title="Rectangle Tool"
          >
            {getToolIcon(ElementType.Rectangle)}
          </button>
          <button
            className={`p-2 rounded ${tool === ElementType.Ellipse ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTool(ElementType.Ellipse)}
            title="Ellipse Tool"
          >
            {getToolIcon(ElementType.Ellipse)}
          </button>
          <button
            className={`p-2 rounded ${tool === ElementType.Text ? 'bg-blue-500 text-white' : 'bg-white text-gray-700 hover:bg-gray-200'}`}
            onClick={() => setTool(ElementType.Text)}
            title="Text Tool"
          >
            {getToolIcon(ElementType.Text)}
          </button>
          <button
            className="p-2 rounded bg-white text-gray-700 hover:bg-gray-200"
            onClick={() => setShowImageUploader(true)}
            title="Add Image"
          >
            {getToolIcon(ElementType.Image)}
          </button>
        </div>

        {/* Color pickers */}
        <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} space-${isHorizontal ? 'x' : 'y'}-4 mr-4 items-center`}>
          {/* Stroke color */}
          <div className="relative">
            <button
              className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center"
              style={{ backgroundColor: strokeColor }}
              onClick={() => setIsColorPickerOpen(!isColorPickerOpen)}
              title="Stroke Color"
            >
              <span className="sr-only">Stroke Color</span>
            </button>

            {isColorPickerOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white p-2 rounded shadow-lg z-10 grid grid-cols-4 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setStrokeColor(color);
                      setIsColorPickerOpen(false);
                    }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Background color */}
          <div className="relative">
            <button
              className="w-8 h-8 rounded border border-gray-300 flex items-center justify-center"
              style={{
                backgroundColor: backgroundColor === 'transparent' ? 'white' : backgroundColor,
                backgroundImage: backgroundColor === 'transparent' ? 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)' : 'none',
                backgroundSize: '8px 8px',
                backgroundPosition: '0 0, 4px 4px',
              }}
              onClick={() => setIsBgColorPickerOpen(!isBgColorPickerOpen)}
              title="Background Color"
            >
              <span className="sr-only">Background Color</span>
            </button>

            {isBgColorPickerOpen && (
              <div className="absolute top-full left-0 mt-1 bg-white p-2 rounded shadow-lg z-10 grid grid-cols-4 gap-1">
                <button
                  className="w-6 h-6 rounded border border-gray-300"
                  style={{
                    backgroundImage: 'linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc), linear-gradient(45deg, #ccc 25%, transparent 25%, transparent 75%, #ccc 75%, #ccc)',
                    backgroundSize: '8px 8px',
                    backgroundPosition: '0 0, 4px 4px',
                  }}
                  onClick={() => {
                    setBackgroundColor('transparent');
                    setIsBgColorPickerOpen(false);
                  }}
                  title="Transparent"
                />
                {colors.map((color) => (
                  <button
                    key={color}
                    className="w-6 h-6 rounded border border-gray-300"
                    style={{ backgroundColor: color }}
                    onClick={() => {
                      setBackgroundColor(color);
                      setIsBgColorPickerOpen(false);
                    }}
                    title={color}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Font size selector (show only when text tool is active) */}
          {tool === ElementType.Text && (
            <div className="relative">
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="p-1 border border-gray-300 rounded bg-white"
                title="Font Size"
              >
                {fontSizes.map((size) => (
                  <option key={size} value={size}>
                    {size}px
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Roughness selector */}
          <div className="relative">
            <select
              value={roughness}
              onChange={(e) => setRoughness(Number(e.target.value))}
              className="p-1 border border-gray-300 rounded bg-white"
              title="Stroke Style"
            >
              {roughnessValues.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Action buttons */}
        <div className={`flex ${isHorizontal ? 'flex-row' : 'flex-col'} space-${isHorizontal ? 'x' : 'y'}-2`}>
          <button
            className="p-2 rounded bg-white text-gray-700 hover:bg-gray-200"
            onClick={() => setShowTemplateGallery(true)}
            title="Templates"
          >
            📋
          </button>
          <button
            className="p-2 rounded bg-white text-gray-700 hover:bg-gray-200"
            onClick={undo}
            disabled={elements.length === 0}
            title="Undo"
          >
            ↩️
          </button>
          <button
            className="p-2 rounded bg-white text-gray-700 hover:bg-gray-200"
            onClick={redo}
            title="Redo"
          >
            ↪️
          </button>
          <button
            className="p-2 rounded bg-red-500 text-white hover:bg-red-600"
            onClick={() => {
              if (window.confirm('Are you sure you want to clear the whiteboard?')) {
                clearWhiteboard();
              }
            }}
            title="Clear Whiteboard"
          >
            🗑️
          </button>
        </div>
      </div>

      {/* Image uploader dialog */}
      {showImageUploader && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <ImageUploader onClose={() => setShowImageUploader(false)} />
        </div>
      )}

      {/* Template gallery dialog */}
      {showTemplateGallery && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <TemplateGallery
            onClose={() => setShowTemplateGallery(false)}
            userId={userId}
          />
        </div>
      )}
    </>
  );
};

export default WhiteboardToolbar;
