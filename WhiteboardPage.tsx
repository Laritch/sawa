import { useState, useCallback } from 'react';
import WhiteboardContainer from './WhiteboardContainer';
import WebinarTemplateManager from './WebinarTemplateManager';
import { Element } from './types';

interface SavedWhiteboard {
  id: string;
  imageUrl: string;
  createdAt: Date;
}

interface WebinarNote {
  id: string;
  text: string;
  timestamp: Date;
  isAction?: boolean;
}

/**
 * Example page showing the whiteboard component in action with webinar-specific features
 */
const WhiteboardPage = () => {
  const [savedWhiteboards, setSavedWhiteboards] = useState<SavedWhiteboard[]>([]);
  const [chatMessages, setChatMessages] = useState<string[]>([]);
  const [webinarNotes, setWebinarNotes] = useState<WebinarNote[]>([]);
  const [webinarMode, setWebinarMode] = useState<'presentation' | 'collaboration' | 'qa'>('presentation');
  const [currentPoll, setCurrentPoll] = useState<{
    question: string;
    options: string[];
    votes: Record<string, number>;
  } | null>(null);
  const [userId] = useState<string>(`user-${Date.now().toString(36)}`);
  const [showTemplateManager, setShowTemplateManager] = useState(false);
  const [currentElements, setCurrentElements] = useState<Element[]>([]);

  // Handle saving whiteboard
  const handleSaveWhiteboard = (imageUrl: string) => {
    const newSavedWhiteboard: SavedWhiteboard = {
      id: `wb-${Date.now()}`,
      imageUrl,
      createdAt: new Date(),
    };

    setSavedWhiteboards([...savedWhiteboards, newSavedWhiteboard]);

    // Show success message
    alert('Whiteboard saved successfully!');
  };

  // Handle chat messages
  const handleChatMessage = useCallback((message: string) => {
    setChatMessages(prev => [...prev, message]);
  }, []);

  // Toggle webinar mode
  const handleModeChange = (mode: 'presentation' | 'collaboration' | 'qa') => {
    setWebinarMode(mode);
  };

  // Add webinar note
  const handleAddNote = (note: string, isAction: boolean = false) => {
    const newNote: WebinarNote = {
      id: `note-${Date.now()}`,
      text: note,
      timestamp: new Date(),
      isAction,
    };
    setWebinarNotes(prev => [...prev, newNote]);
  };

  // Start a poll
  const handleStartPoll = (question: string, options: string[]) => {
    setCurrentPoll({
      question,
      options,
      votes: options.reduce((acc, option) => ({ ...acc, [option]: 0 }), {}),
    });
  };

  // Handle poll vote
  const handlePollVote = (option: string) => {
    if (!currentPoll) return;

    setCurrentPoll({
      ...currentPoll,
      votes: {
        ...currentPoll.votes,
        [option]: (currentPoll.votes[option] || 0) + 1,
      },
    });
  };

  // Handle applying a template from the template manager
  const handleApplyTemplate = (elements: Element[]) => {
    setCurrentElements(elements);
    // In a real implementation, you would pass these elements to the whiteboard
    alert(`Applied template with ${elements.length} elements!`);
  };

  return (
    <div className="container mx-auto p-4">
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Interactive Webinar Whiteboard</h1>
        <p className="text-gray-600">
          Real-time whiteboarding designed specifically for interactive webinars. Engage your audience with visual collaboration.
        </p>
      </header>

      {/* Webinar Mode Selection */}
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-100">
        <h2 className="text-lg font-semibold text-blue-800 mb-3">Webinar Mode</h2>
        <div className="flex space-x-4">
          <button
            className={`px-4 py-2 rounded ${webinarMode === 'presentation' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => handleModeChange('presentation')}
          >
            Presentation Mode
          </button>
          <button
            className={`px-4 py-2 rounded ${webinarMode === 'collaboration' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => handleModeChange('collaboration')}
          >
            Collaboration Mode
          </button>
          <button
            className={`px-4 py-2 rounded ${webinarMode === 'qa' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-700'}`}
            onClick={() => handleModeChange('qa')}
          >
            Q&A Mode
          </button>
        </div>
      </div>

      {/* Feature highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
          <h3 className="font-semibold text-blue-800 mb-2">Real-time Collaboration</h3>
          <p className="text-sm text-blue-700">
            Engage webinar participants with real-time shared whiteboarding and visual brainstorming.
          </p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
          <h3 className="font-semibold text-purple-800 mb-2">Webinar Templates</h3>
          <p className="text-sm text-purple-700">
            Use specialized templates for presentations, Q&A sessions, polls, and interactive exercises.
          </p>
        </div>
        <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-100">
          <h3 className="font-semibold text-indigo-800 mb-2">Audience Engagement</h3>
          <p className="text-sm text-indigo-700">
            Collect feedback, votes, and questions directly on the whiteboard interface.
          </p>
        </div>
      </div>

      <div className="mb-8">
        <WhiteboardContainer
          title="Webinar Whiteboard"
          width={1200}
          height={700}
          toolbarPosition="top"
          onSave={handleSaveWhiteboard}
          // Use mode-specific settings
          showModerationPanel={webinarMode === 'presentation'}
          showCollaborationPanel={webinarMode === 'collaboration'}
          showChatPanel={webinarMode === 'qa'}
          onChatMessage={handleChatMessage}
        />
      </div>

      {/* Webinar Tools Section */}
      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-bold mb-4">Webinar Notes</h2>
          <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
            {/* Add note form */}
            <div className="mb-4 flex">
              <input
                type="text"
                id="note-input"
                className="flex-1 border border-gray-300 rounded-l px-3 py-2"
                placeholder="Add a webinar note..."
              />
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded-r"
                onClick={() => {
                  const input = document.getElementById('note-input') as HTMLInputElement;
                  if (input.value.trim()) {
                    handleAddNote(input.value.trim());
                    input.value = '';
                  }
                }}
              >
                Add Note
              </button>
            </div>

            {/* Notes list */}
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {webinarNotes.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No notes yet. Add notes during your webinar to keep track of important points.</p>
              ) : (
                webinarNotes.map(note => (
                  <div
                    key={note.id}
                    className={`p-3 rounded-lg ${note.isAction ? 'bg-yellow-50 border-l-4 border-yellow-400' : 'bg-white border border-gray-200'}`}
                  >
                    <p className="text-gray-800">{note.text}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-500">
                        {note.timestamp.toLocaleTimeString()}
                      </span>
                      {!note.isAction && (
                        <button
                          className="text-xs text-blue-600 hover:text-blue-800"
                          onClick={() => {
                            // Convert to action item
                            const updatedNotes = webinarNotes.map(n =>
                              n.id === note.id ? {...n, isAction: true} : n
                            );
                            setWebinarNotes(updatedNotes);
                          }}
                        >
                          Convert to action item
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-2xl font-bold mb-4">Audience Engagement</h2>
          <div className="bg-indigo-50 rounded-lg p-4 border border-indigo-100">
            {/* Polls section */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2">Quick Poll</h3>

              {currentPoll ? (
                <div className="bg-white rounded-lg p-4 border border-indigo-100">
                  <h4 className="font-medium text-lg mb-3">{currentPoll.question}</h4>
                  <div className="space-y-3">
                    {currentPoll.options.map(option => (
                      <div key={option} className="flex items-center">
                        <div className="flex-1">
                          <div className="flex justify-between mb-1">
                            <span>{option}</span>
                            <span className="text-sm text-gray-600">
                              {currentPoll.votes[option] || 0} votes
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-indigo-600 h-2.5 rounded-full"
                              style={{
                                width: `${Math.max(5, (currentPoll.votes[option] || 0) /
                                  Object.values(currentPoll.votes).reduce((a, b) => a + b, 0) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                        <button
                          className="ml-3 px-3 py-1 bg-indigo-100 text-indigo-800 rounded text-sm"
                          onClick={() => handlePollVote(option)}
                        >
                          Vote
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 flex justify-end">
                    <button
                      className="px-3 py-1 bg-gray-200 text-gray-700 rounded text-sm"
                      onClick={() => setCurrentPoll(null)}
                    >
                      End Poll
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-white rounded-lg p-4 border border-indigo-100">
                  <button
                    className="w-full py-2 bg-indigo-600 text-white rounded"
                    onClick={() => handleStartPoll("How useful is this whiteboard for webinars?", [
                      "Very useful", "Somewhat useful", "Neutral", "Not very useful"
                    ])}
                  >
                    Start Sample Poll
                  </button>
                </div>
              )}
            </div>

            {/* Recent Chat */}
            <h3 className="text-lg font-semibold mb-2">Recent Chat Activity</h3>
            <div className="bg-white rounded-lg p-4 border border-indigo-100">
              {chatMessages.length === 0 ? (
                <p className="text-indigo-500 text-center py-6">
                  No chat messages yet. Try sending a message in the chat panel!
                </p>
              ) : (
                <ul className="space-y-2">
                  {chatMessages.slice(-5).map((message, index) => (
                    <li key={index} className="bg-white p-2 rounded shadow-sm">
                      <p className="text-sm">{message}</p>
                      <p className="text-xs text-gray-500 text-right mt-1">
                        Just now
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Webinar Templates Section */}
      <div className="mt-12 bg-blue-50 rounded-lg p-6 border border-blue-100 mb-8">
        <h2 className="text-xl font-semibold mb-4">Webinar Templates</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all">
            <h3 className="font-medium mb-2">Agenda Template</h3>
            <p className="text-sm text-gray-600 mb-3">Perfect for outlining your webinar agenda with time blocks.</p>
            <button
              className="w-full py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowTemplateManager(true)}
            >
              Use Template
            </button>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all">
            <h3 className="font-medium mb-2">Q&A Collection</h3>
            <p className="text-sm text-gray-600 mb-3">Organize audience questions during your webinar.</p>
            <button
              className="w-full py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowTemplateManager(true)}
            >
              Use Template
            </button>
          </div>
          <div className="bg-white rounded-lg p-4 border border-gray-200 hover:shadow-md transition-all">
            <h3 className="font-medium mb-2">Breakout Session</h3>
            <p className="text-sm text-gray-600 mb-3">Structured template for small group discussions.</p>
            <button
              className="w-full py-2 bg-blue-600 text-white rounded"
              onClick={() => setShowTemplateManager(true)}
            >
              Use Template
            </button>
          </div>
        </div>
      </div>

      {savedWhiteboards.length > 0 && (
        <div className="mt-12">
          <h2 className="text-2xl font-bold mb-4">Saved Webinar Whiteboards</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {savedWhiteboards.map((whiteboard) => (
              <div key={whiteboard.id} className="border border-gray-300 rounded-lg overflow-hidden shadow-sm">
                <div className="bg-gray-100 p-3">
                  <div className="text-sm text-gray-600">
                    Saved on: {whiteboard.createdAt.toLocaleString()}
                  </div>
                </div>
                <div className="p-4">
                  <div className="bg-gray-200 text-center p-8 rounded">
                    <div className="text-gray-500">
                      [Whiteboard Image: {whiteboard.imageUrl}]
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-3 border-t border-gray-200 flex justify-end">
                  <button className="text-blue-500 hover:text-blue-600 text-sm">
                    Download
                  </button>
                  <button className="text-red-500 hover:text-red-600 text-sm ml-4"
                    onClick={() => {
                      setSavedWhiteboards(savedWhiteboards.filter(wb => wb.id !== whiteboard.id));
                    }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="mt-12 bg-gray-50 rounded-lg p-6 border border-gray-200">
        <h2 className="text-xl font-semibold mb-4">Webinar Whiteboard Tips</h2>
        <ul className="space-y-2 text-gray-700">
          <li><strong>Presentation Mode:</strong> Use templates and pre-designed layouts to present information</li>
          <li><strong>Collaboration Mode:</strong> Enable audience participation for brainstorming sessions</li>
          <li><strong>Q&A Mode:</strong> Collect and organize participant questions visually</li>
          <li><strong>Templates:</strong> Save time by using purpose-built webinar templates</li>
          <li><strong>Polling:</strong> Engage your audience with visual polls and voting</li>
          <li><strong>Take Notes:</strong> Capture important points and convert them to action items</li>
          <li><strong>Save & Share:</strong> Export your whiteboard to share with participants after the webinar</li>
        </ul>
      </div>

      {/* Webinar Template Manager */}
      {showTemplateManager && (
        <WebinarTemplateManager
          userId={userId}
          onApplyTemplate={handleApplyTemplate}
          onClose={() => setShowTemplateManager(false)}
        />
      )}
    </div>
  );
};

export default WhiteboardPage;
