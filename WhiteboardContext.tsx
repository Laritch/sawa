import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Element, ElementType, ModerationStatus } from './types';
import { nanoid } from 'nanoid';

// Define the context interface
interface WhiteboardContextType {
  elements: Element[];
  setElements: React.Dispatch<React.SetStateAction<Element[]>>;
  selectedElement: Element | null;
  setSelectedElement: React.Dispatch<React.SetStateAction<Element | null>>;
  currentTool: ElementType;
  setCurrentTool: React.Dispatch<React.SetStateAction<ElementType>>;
  addElement: (element: Partial<Element>) => void;
  addElements: (elements: Element[]) => void;
  updateElement: (id: string, changes: Partial<Element>) => void;
  deleteElement: (id: string) => void;
}

// Create the context
const WhiteboardContext = createContext<WhiteboardContextType | null>(null);

// Context provider component
export const WhiteboardProvider: React.FC<{
  children: ReactNode;
  userId: string;
}> = ({ children, userId }) => {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElement, setSelectedElement] = useState<Element | null>(null);
  const [currentTool, setCurrentTool] = useState<ElementType>(ElementType.Pencil);

  // Add a single element
  const addElement = useCallback(
    (elementData: Partial<Element>) => {
      const newElement: Element = {
        id: nanoid(),
        type: elementData.type || ElementType.Pencil,
        x: elementData.x || 0,
        y: elementData.y || 0,
        strokeColor: elementData.strokeColor || '#000000',
        backgroundColor: elementData.backgroundColor,
        width: elementData.width,
        height: elementData.height,
        text: elementData.text,
        fontSize: elementData.fontSize,
        fontFamily: elementData.fontFamily,
        points: elementData.points,
        path: elementData.path,
        imageUrl: elementData.imageUrl,
        imageData: elementData.imageData,
        angle: elementData.angle || 0,
        opacity: elementData.opacity !== undefined ? elementData.opacity : 1,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        createdBy: userId,
        moderationStatus: ModerationStatus.Approved,
      };

      setElements(prevElements => [...prevElements, newElement]);
      return newElement;
    },
    [userId]
  );

  // Add multiple elements (used for templates)
  const addElements = useCallback(
    (newElements: Element[]) => {
      setElements(prevElements => [...prevElements, ...newElements]);
    },
    []
  );

  // Update an existing element
  const updateElement = useCallback((id: string, changes: Partial<Element>) => {
    setElements(prevElements =>
      prevElements.map(element =>
        element.id === id
          ? { ...element, ...changes, updatedAt: Date.now() }
          : element
      )
    );
  }, []);

  // Delete an element
  const deleteElement = useCallback((id: string) => {
    setElements(prevElements =>
      prevElements.filter(element => element.id !== id)
    );
  }, []);

  const contextValue: WhiteboardContextType = {
    elements,
    setElements,
    selectedElement,
    setSelectedElement,
    currentTool,
    setCurrentTool,
    addElement,
    addElements,
    updateElement,
    deleteElement,
  };

  return (
    <WhiteboardContext.Provider value={contextValue}>
      {children}
    </WhiteboardContext.Provider>
  );
};

// Hook for using the context
export const useWhiteboardContext = () => {
  const context = useContext(WhiteboardContext);
  if (context === null) {
    throw new Error('useWhiteboardContext must be used within a WhiteboardProvider');
  }
  return context;
};
