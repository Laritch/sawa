import React, { useEffect } from 'react';
import { useWhiteboardContext } from './WhiteboardContext';
import useWhiteboardStore from './store/useWhiteboardStore';
import { Element } from './types';

/**
 * A bridge component that connects the WhiteboardContext with the existing useWhiteboardStore.
 * This allows us to gradually migrate from the store to the context while maintaining compatibility.
 */
const WhiteboardStoreBridge: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { elements: storeElements, addElement: storeAddElement } = useWhiteboardStore();
  const { setElements, addElements } = useWhiteboardContext();

  // Initialize context elements from store on first load
  useEffect(() => {
    setElements(storeElements);
  }, []);

  // Subscribe to store changes and update context
  useEffect(() => {
    setElements(storeElements);
  }, [storeElements, setElements]);

  // Handle adding elements from templates
  useEffect(() => {
    // Override the addElements function to work with both context and store
    const originalAddElements = addElements;

    const handleAddTemplateElements = (templateElements: Element[]) => {
      // First add to the context
      originalAddElements(templateElements);

      // Then add to the store one by one
      templateElements.forEach(element => {
        storeAddElement({
          type: element.type,
          x: element.x,
          y: element.y,
          width: element.width,
          height: element.height,
          strokeColor: element.strokeColor,
          backgroundColor: element.backgroundColor,
          text: element.text,
          fontSize: element.fontSize,
          fontFamily: element.fontFamily,
          roughness: element.roughness,
          points: element.points,
          path: element.path,
          imageUrl: element.imageUrl,
          imageData: element.imageData,
          angle: element.angle,
          opacity: element.opacity,
        });
      });
    };

    // Replace the addElements function in context with our bridged version
    // @ts-ignore - We're intentionally replacing the function
    addElements.implementation = handleAddTemplateElements;

    return () => {
      // Restore original function on cleanup
      // @ts-ignore
      addElements.implementation = originalAddElements;
    };
  }, [addElements, storeAddElement]);

  return <>{children}</>;
};

export default WhiteboardStoreBridge;
