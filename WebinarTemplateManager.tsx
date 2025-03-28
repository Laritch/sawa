import React, { useState } from 'react';
import { Element, ElementType } from './types';
import { templateService, TemplateCategory } from './services/templateService';

interface WebinarTemplateManagerProps {
  userId: string;
  onApplyTemplate: (elements: Element[]) => void;
  onClose: () => void;
}

// Webinar-specific template types
type WebinarTemplateType =
  'agenda' |
  'qa' |
  'poll' |
  'breakout' |
  'brainstorm' |
  'feedback' |
  'actionItems';

interface WebinarTemplate {
  id: string;
  type: WebinarTemplateType;
  name: string;
  description: string;
  thumbnail: string;
  category: TemplateCategory;
}

const WebinarTemplateManager: React.FC<WebinarTemplateManagerProps> = ({
  userId,
  onApplyTemplate,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<WebinarTemplateType | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Sample webinar template definitions
  const webinarTemplates: WebinarTemplate[] = [
    {
      id: 'agenda-1',
      type: 'agenda',
      name: 'Simple Agenda',
      description: 'Basic agenda layout with time slots and topics',
      thumbnail: '/thumbnails/agenda-simple.png',
      category: TemplateCategory.Business,
    },
    {
      id: 'agenda-2',
      type: 'agenda',
      name: 'Detailed Agenda',
      description: 'Comprehensive agenda with speakers, topics, and time blocks',
      thumbnail: '/thumbnails/agenda-detailed.png',
      category: TemplateCategory.Business,
    },
    {
      id: 'qa-1',
      type: 'qa',
      name: 'Q&A Collection',
      description: 'Organize participant questions in categories',
      thumbnail: '/thumbnails/qa-collection.png',
      category: TemplateCategory.Education,
    },
    {
      id: 'poll-1',
      type: 'poll',
      name: 'Visual Poll',
      description: 'Create engaging visual polls for audience feedback',
      thumbnail: '/thumbnails/visual-poll.png',
      category: TemplateCategory.Business,
    },
    {
      id: 'breakout-1',
      type: 'breakout',
      name: 'Breakout Rooms',
      description: 'Organize breakout discussions with clear instructions',
      thumbnail: '/thumbnails/breakout.png',
      category: TemplateCategory.Education,
    },
    {
      id: 'brainstorm-1',
      type: 'brainstorm',
      name: 'Idea Collection',
      description: 'Structured brainstorming layout for webinar participants',
      thumbnail: '/thumbnails/brainstorm.png',
      category: TemplateCategory.Brainstorming,
    },
    {
      id: 'feedback-1',
      type: 'feedback',
      name: 'Participant Feedback',
      description: 'Collect and organize participant feedback',
      thumbnail: '/thumbnails/feedback.png',
      category: TemplateCategory.Business,
    },
    {
      id: 'actionItems-1',
      type: 'actionItems',
      name: 'Action Items',
      description: 'Track action items and follow-ups from the webinar',
      thumbnail: '/thumbnails/action-items.png',
      category: TemplateCategory.ProjectManagement,
    },
  ];

  // Filter templates based on selected type and search query
  const filteredTemplates = webinarTemplates.filter(template => {
    // Filter by type if selected
    if (selectedType && template.type !== selectedType) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      );
    }

    return true;
  });

  // Generate elements for a specific template
  const generateTemplateElements = (templateId: string): Element[] => {
    const now = Date.now();
    let elements: Element[] = [];

    // Find template
    const template = webinarTemplates.find(t => t.id === templateId);
    if (!template) return [];

    // Generate different elements based on template type
    switch (template.type) {
      case 'agenda':
        elements = createAgendaTemplate(template.id, now);
        break;
      case 'qa':
        elements = createQATemplate(template.id, now);
        break;
      case 'poll':
        elements = createPollTemplate(template.id, now);
        break;
      case 'breakout':
        elements = createBreakoutTemplate(template.id, now);
        break;
      case 'brainstorm':
        elements = createBrainstormTemplate(template.id, now);
        break;
      case 'feedback':
        elements = createFeedbackTemplate(template.id, now);
        break;
      case 'actionItems':
        elements = createActionItemsTemplate(template.id, now);
        break;
      default:
        elements = [];
    }

    return elements;
  };

  // Template generating functions
  const createAgendaTemplate = (templateId: string, now: number): Element[] => {
    const elements: Element[] = [];
    const startX = 100;
    const startY = 50;
    const headerWidth = 600;
    const headerHeight = 60;
    const rowHeight = 80;
    const timeColWidth = 120;
    const topicColWidth = 300;
    const speakerColWidth = 180;

    // Header
    elements.push({
      id: `${templateId}-title-${now}`,
      type: ElementType.Text,
      x: startX + headerWidth / 2,
      y: startY,
      text: 'Webinar Agenda',
      fontSize: 24,
      fontFamily: 'Arial',
      strokeColor: '#1f2937',
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      moderationStatus: 'approved',
    });

    // Header background
    elements.push({
      id: `${templateId}-header-bg-${now}`,
      type: ElementType.Rectangle,
      x: startX,
      y: startY + 40,
      width: headerWidth,
      height: headerHeight,
      strokeColor: '#3b82f6',
      backgroundColor: '#3b82f6',
      opacity: 1,
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      moderationStatus: 'approved',
    });

    // Header columns
    const headerColumns = ['Time', 'Topic', 'Speaker'];
    const headerWidths = [timeColWidth, topicColWidth, speakerColWidth];

    headerColumns.forEach((col, i) => {
      const colX = startX + headerWidths.slice(0, i).reduce((sum, w) => sum + w, 0);

      elements.push({
        id: `${templateId}-header-${i}-${now}`,
        type: ElementType.Text,
        x: colX + headerWidths[i] / 2,
        y: startY + 40 + headerHeight / 2,
        text: col,
        fontSize: 16,
        fontFamily: 'Arial',
        strokeColor: '#ffffff',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        moderationStatus: 'approved',
      });
    });

    // Rows
    const agendaItems = [
      { time: '10:00 - 10:15', topic: 'Welcome & Introduction', speaker: 'John Smith' },
      { time: '10:15 - 10:45', topic: 'Main Presentation', speaker: 'Sarah Johnson' },
      { time: '10:45 - 11:00', topic: 'Q&A Session', speaker: 'All Speakers' },
      { time: '11:00 - 11:25', topic: 'Breakout Discussion', speaker: 'Participants' },
      { time: '11:25 - 11:30', topic: 'Wrap-up & Next Steps', speaker: 'John Smith' },
    ];

    agendaItems.forEach((item, rowIndex) => {
      const rowY = startY + 40 + headerHeight + rowIndex * rowHeight;

      // Row background (alternating)
      elements.push({
        id: `${templateId}-row-bg-${rowIndex}-${now}`,
        type: ElementType.Rectangle,
        x: startX,
        y: rowY,
        width: headerWidth,
        height: rowHeight,
        strokeColor: '#e5e7eb',
        backgroundColor: rowIndex % 2 === 0 ? '#f9fafb' : '#ffffff',
        opacity: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        moderationStatus: 'approved',
      });

      // Row content
      const data = [item.time, item.topic, item.speaker];

      data.forEach((text, colIndex) => {
        const colX = startX + headerWidths.slice(0, colIndex).reduce((sum, w) => sum + w, 0);

        elements.push({
          id: `${templateId}-cell-${rowIndex}-${colIndex}-${now}`,
          type: ElementType.Text,
          x: colX + headerWidths[colIndex] / 2,
          y: rowY + rowHeight / 2,
          text,
          fontSize: 14,
          fontFamily: 'Arial',
          strokeColor: '#374151',
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          moderationStatus: 'approved',
        });
      });
    });

    return elements;
  };

  const createQATemplate = (templateId: string, now: number): Element[] => {
    const elements: Element[] = [];
    const startX = 100;
    const startY = 50;
    const width = 600;
    const headerHeight = 60;
    const sectionHeight = 300;
    const columnWidth = 280;
    const padding = 40;

    // Title
    elements.push({
      id: `${templateId}-title-${now}`,
      type: ElementType.Text,
      x: startX + width / 2,
      y: startY,
      text: 'Q&A Collection',
      fontSize: 24,
      fontFamily: 'Arial',
      strokeColor: '#1f2937',
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      moderationStatus: 'approved',
    });

    // Sections
    const sections = [
      { title: 'Questions to Answer Now', color: '#fef3c7', strokeColor: '#f59e0b' },
      { title: 'Questions for Later', color: '#e0e7ff', strokeColor: '#6366f1' },
    ];

    sections.forEach((section, index) => {
      const sectionX = startX + index * (columnWidth + padding);

      // Section background
      elements.push({
        id: `${templateId}-section-bg-${index}-${now}`,
        type: ElementType.Rectangle,
        x: sectionX,
        y: startY + 40,
        width: columnWidth,
        height: sectionHeight,
        strokeColor: section.strokeColor,
        backgroundColor: section.color,
        opacity: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        moderationStatus: 'approved',
      });

      // Section header
      elements.push({
        id: `${templateId}-section-header-${index}-${now}`,
        type: ElementType.Text,
        x: sectionX + columnWidth / 2,
        y: startY + 60,
        text: section.title,
        fontSize: 16,
        fontFamily: 'Arial',
        strokeColor: '#1f2937',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        moderationStatus: 'approved',
      });

      // Sample questions
      const questions = index === 0
        ? [
            'How do I implement this feature?',
            'What are the key benefits?',
            'When will this be available?'
          ]
        : [
            'Can you explain the technical architecture?',
            'What is the roadmap for next quarter?',
          ];

      questions.forEach((question, qIndex) => {
        const questionY = startY + 90 + qIndex * 50;

        // Question box
        elements.push({
          id: `${templateId}-question-box-${index}-${qIndex}-${now}`,
          type: ElementType.Rectangle,
          x: sectionX + 10,
          y: questionY,
          width: columnWidth - 20,
          height: 40,
          strokeColor: '#ffffff',
          backgroundColor: '#ffffff',
          opacity: 1,
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          moderationStatus: 'approved',
        });

        // Question text
        elements.push({
          id: `${templateId}-question-text-${index}-${qIndex}-${now}`,
          type: ElementType.Text,
          x: sectionX + columnWidth / 2,
          y: questionY + 20,
          text: question,
          fontSize: 12,
          fontFamily: 'Arial',
          strokeColor: '#374151',
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          moderationStatus: 'approved',
        });
      });
    });

    return elements;
  };

  const createPollTemplate = (templateId: string, now: number): Element[] => {
    // Implementation for poll template
    const elements: Element[] = [];
    const startX = 100;
    const startY = 50;
    const width = 600;
    const headerHeight = 60;
    const optionHeight = 60;
    const optionWidth = 500;

    // Title
    elements.push({
      id: `${templateId}-title-${now}`,
      type: ElementType.Text,
      x: startX + width / 2,
      y: startY,
      text: 'Webinar Poll',
      fontSize: 24,
      fontFamily: 'Arial',
      strokeColor: '#1f2937',
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      moderationStatus: 'approved',
    });

    // Question
    elements.push({
      id: `${templateId}-question-${now}`,
      type: ElementType.Text,
      x: startX + width / 2,
      y: startY + 50,
      text: 'How would you rate the content of this webinar?',
      fontSize: 18,
      fontFamily: 'Arial',
      strokeColor: '#374151',
      createdAt: now,
      updatedAt: now,
      createdBy: userId,
      moderationStatus: 'approved',
    });

    // Options
    const options = [
      { text: 'Very Good', votes: 15, color: '#34d399' },
      { text: 'Good', votes: 8, color: '#60a5fa' },
      { text: 'Average', votes: 4, color: '#fbbf24' },
      { text: 'Poor', votes: 1, color: '#f87171' },
    ];

    const totalVotes = options.reduce((sum, option) => sum + option.votes, 0);

    options.forEach((option, index) => {
      const optionY = startY + 100 + index * (optionHeight + 10);
      const votePercentage = Math.round((option.votes / totalVotes) * 100);
      const barWidth = Math.max(50, (option.votes / totalVotes) * optionWidth);

      // Option bar background
      elements.push({
        id: `${templateId}-option-bg-${index}-${now}`,
        type: ElementType.Rectangle,
        x: startX,
        y: optionY,
        width: optionWidth,
        height: optionHeight,
        strokeColor: '#e5e7eb',
        backgroundColor: '#f9fafb',
        opacity: 1,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        moderationStatus: 'approved',
      });

      // Option bar fill
      elements.push({
        id: `${templateId}-option-fill-${index}-${now}`,
        type: ElementType.Rectangle,
        x: startX,
        y: optionY,
        width: barWidth,
        height: optionHeight,
        strokeColor: option.color,
        backgroundColor: option.color,
        opacity: 0.7,
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        moderationStatus: 'approved',
      });

      // Option text
      elements.push({
        id: `${templateId}-option-text-${index}-${now}`,
        type: ElementType.Text,
        x: startX + 20,
        y: optionY + optionHeight / 2,
        text: option.text,
        fontSize: 16,
        fontFamily: 'Arial',
        strokeColor: '#1f2937',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        moderationStatus: 'approved',
      });

      // Votes text
      elements.push({
        id: `${templateId}-votes-${index}-${now}`,
        type: ElementType.Text,
        x: startX + optionWidth - 50,
        y: optionY + optionHeight / 2,
        text: `${option.votes} (${votePercentage}%)`,
        fontSize: 14,
        fontFamily: 'Arial',
        strokeColor: '#4b5563',
        createdAt: now,
        updatedAt: now,
        createdBy: userId,
        moderationStatus: 'approved',
      });
    });

    return elements;
  };

  const createBreakoutTemplate = (templateId: string, now: number): Element[] => {
    // The rest of the template generation functions would be similar
    return [];
  };

  const createBrainstormTemplate = (templateId: string, now: number): Element[] => {
    return [];
  };

  const createFeedbackTemplate = (templateId: string, now: number): Element[] => {
    return [];
  };

  const createActionItemsTemplate = (templateId: string, now: number): Element[] => {
    return [];
  };

  // Handle applying a template
  const handleApplyTemplate = (templateId: string) => {
    const elements = generateTemplateElements(templateId);
    if (elements.length > 0) {
      onApplyTemplate(elements);
      onClose();
    }
  };

  // Styles
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  };

  const contentStyle: React.CSSProperties = {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
    width: '900px',
    maxWidth: '95vw',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
  };

  const headerStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const filtersStyle: React.CSSProperties = {
    padding: '16px 24px',
    borderBottom: '1px solid #e5e7eb',
    display: 'flex',
    gap: '16px',
    flexWrap: 'wrap',
  };

  const searchStyle: React.CSSProperties = {
    flex: '1',
    minWidth: '200px',
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    fontSize: '0.875rem',
  };

  const filterButtonStyle: React.CSSProperties = {
    padding: '8px 12px',
    border: '1px solid #d1d5db',
    borderRadius: '4px',
    backgroundColor: '#f9fafb',
    fontSize: '0.875rem',
    cursor: 'pointer',
  };

  const activeFilterStyle: React.CSSProperties = {
    ...filterButtonStyle,
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
    color: '#3b82f6',
  };

  const templateGridStyle: React.CSSProperties = {
    padding: '24px',
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '16px',
    overflow: 'auto',
    flex: '1',
  };

  const templateCardStyle: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    overflow: 'hidden',
    transition: 'transform 0.2s, box-shadow 0.2s',
    cursor: 'pointer',
  };

  const templateCardHoverStyle: React.CSSProperties = {
    transform: 'translateY(-4px)',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  };

  const templateImageStyle: React.CSSProperties = {
    width: '100%',
    height: '120px',
    backgroundColor: '#f3f4f6',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#9ca3af',
    fontSize: '0.75rem',
  };

  const templateInfoStyle: React.CSSProperties = {
    padding: '12px',
  };

  const templateTitleStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '0.875rem',
    fontWeight: 600,
    color: '#1f2937',
    marginBottom: '4px',
  };

  const templateDescStyle: React.CSSProperties = {
    margin: 0,
    fontSize: '0.75rem',
    color: '#6b7280',
  };

  const templateTypeStyle: React.CSSProperties = {
    display: 'inline-block',
    padding: '2px 6px',
    backgroundColor: '#eff6ff',
    color: '#3b82f6',
    borderRadius: '4px',
    fontSize: '0.625rem',
    fontWeight: 500,
    marginTop: '8px',
  };

  return (
    <div style={containerStyle}>
      <div style={contentStyle}>
        <div style={headerStyle}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Webinar Templates</h2>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#6b7280',
            }}
            onClick={onClose}
          >
            ×
          </button>
        </div>

        <div style={filtersStyle}>
          <input
            type="text"
            placeholder="Search templates..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={searchStyle}
          />

          <button
            style={selectedType === null ? activeFilterStyle : filterButtonStyle}
            onClick={() => setSelectedType(null)}
          >
            All
          </button>
          <button
            style={selectedType === 'agenda' ? activeFilterStyle : filterButtonStyle}
            onClick={() => setSelectedType('agenda')}
          >
            Agenda
          </button>
          <button
            style={selectedType === 'qa' ? activeFilterStyle : filterButtonStyle}
            onClick={() => setSelectedType('qa')}
          >
            Q&A
          </button>
          <button
            style={selectedType === 'poll' ? activeFilterStyle : filterButtonStyle}
            onClick={() => setSelectedType('poll')}
          >
            Polls
          </button>
          <button
            style={selectedType === 'breakout' ? activeFilterStyle : filterButtonStyle}
            onClick={() => setSelectedType('breakout')}
          >
            Breakout
          </button>
        </div>

        <div style={templateGridStyle}>
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              style={templateCardStyle}
              onClick={() => handleApplyTemplate(template.id)}
              onMouseEnter={(e) => {
                Object.assign(e.currentTarget.style, templateCardHoverStyle);
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = '';
                e.currentTarget.style.boxShadow = '';
              }}
            >
              <div style={templateImageStyle}>
                {template.thumbnail ? (
                  <img
                    src={template.thumbnail}
                    alt={template.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  'No preview available'
                )}
              </div>
              <div style={templateInfoStyle}>
                <h3 style={templateTitleStyle}>{template.name}</h3>
                <p style={templateDescStyle}>{template.description}</p>
                <span style={templateTypeStyle}>{template.type}</span>
              </div>
            </div>
          ))}

          {filteredTemplates.length === 0 && (
            <div style={{
              gridColumn: '1 / -1',
              textAlign: 'center',
              padding: '32px',
              color: '#6b7280'
            }}>
              No templates match your criteria
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebinarTemplateManager;
