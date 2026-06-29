import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, Menu, X, ArrowLeft } from 'lucide-react';

const API = "https://codexa-production-c1d6.up.railway.app/api";

const ChatPage = () => {
  const navigate = useNavigate();
  
  const [repoUrl, setRepoUrl] = useState('');
  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([]);
  const [isIndexing, setIsIndexing] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [indexStatus, setIndexStatus] = useState('');
  
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleIndexRepo = async () => {
    if (!repoUrl) return;
    setIsIndexing(true);
    setIndexStatus('Indexing repository... This may take a moment ⏳');
    
    try {
      const response = await fetch(`${API}/repo/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ repoUrl })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIndexStatus('✅ Repository successfully indexed! You can now ask questions.');
      } else {
        setIndexStatus(`❌ Error: ${data.error || 'Failed to index'}`);
      }
    } catch (error) {
      setIndexStatus(`❌ Network Error: Could not connect to server.`);
    } finally {
      setIsIndexing(false);
    }
  };

  // Backend API Integration for Sending Messages
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim() || isTyping) return;

    const userMessage = chatInput.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsTyping(true);

    try {
      const response = await fetch(`${API}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: userMessage, message: userMessage })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setMessages(prev => [...prev, { role: 'ai', content: data.answer || data.response || data.message }]);
      } else {
        const errorText = (data.error || '').toLowerCase();
        
        // Strictly checking for actual Rate Limit / Quota errors
        if (response.status === 429 || errorText.includes('quota') || errorText.includes('rate limit') || errorText.includes('too many requests')) {
          setMessages(prev => [...prev, { role: 'ai', content: "Too many users trying at the same time. Please come back after some time." }]);
        } else {
          // If it's a backend crash, it will show the actual error
          setMessages(prev => [...prev, { role: 'ai', content: `Error: ${data.error}` }]);
        }
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'ai', content: 'Network Error: Failed to reach the AI.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-screen w-full bg-white font-sans overflow-hidden">
      
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Left) */}
      <aside className={`
        fixed md:relative z-50 h-full w-[80%] md:w-[25%] max-w-[300px] 
        bg-gray-50 border-r border-gray-200 flex flex-col justify-between
        transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between md:mb-4">
            <h1 className="text-xl font-bold tracking-tight text-gray-900">
              Codexa <span className="text-orange-500">AI</span>
            </h1>
            <button 
              className="md:hidden text-gray-500" 
              onClick={() => setIsSidebarOpen(false)}
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700">Repository URL</label>
            <input
              type="text"
              placeholder="Paste GitHub Repo URL..."
              className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-shadow"
              value={repoUrl}
              onChange={(e) => setRepoUrl(e.target.value)}
              disabled={isIndexing}
            />
            <button
              onClick={handleIndexRepo}
              disabled={isIndexing || !repoUrl}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed shadow-sm"
            >
              {isIndexing ? 'Indexing...' : 'Index Repo'}
            </button>
            
            {indexStatus && (
              <div className={`mt-3 p-3 rounded-lg text-xs font-medium leading-relaxed ${
                indexStatus.includes('✅') ? 'bg-green-50 text-green-800 border border-green-200' : 
                indexStatus.includes('❌') ? 'bg-red-50 text-red-800 border border-red-200' : 
                'bg-blue-50 text-blue-800 border border-blue-200'
              }`}>
                {indexStatus}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t border-gray-200">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to Home
          </button>
        </div>
      </aside>

      {/* Main Chat Area (Right) */}
      <main className="flex-1 flex flex-col h-full bg-white relative min-w-0">
        
        <header className="md:hidden flex items-center justify-between p-4 border-b border-gray-200 bg-white">
          <div className="text-lg font-bold text-gray-900">
            Codexa <span className="text-orange-500">AI</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 text-gray-600">
            <Menu size={20} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 pb-32">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-gray-400">
              <div className="w-16 h-16 mb-4 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 shadow-sm">
                <span className="text-2xl font-bold text-orange-500">&lt; /&gt;</span>
              </div>
              <p className="text-center text-gray-500 max-w-sm">
                Index a repository on the left, then ask Codexa AI to explain the code, find bugs, or review architecture!
              </p>
            </div>
          ) : (
            messages.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`
                  max-w-[85%] md:max-w-[75%] px-5 py-3.5 shadow-sm text-[15px] leading-relaxed
                  ${msg.role === 'user' 
                    ? 'bg-orange-500 text-white rounded-2xl rounded-tr-sm' 
                    : 'bg-gray-100 text-gray-900 rounded-2xl rounded-tl-sm'
                  }
                `}>
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 rounded-2xl rounded-tl-sm px-5 py-3.5 shadow-sm text-[15px] flex items-center gap-2">
                <div className="flex gap-1">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </div>
                <span className="ml-2 font-medium text-sm">Codexa is thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Sticky Bottom Input Area */}
        <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 bg-white border-t border-gray-100 bg-gradient-to-t from-white via-white to-transparent">
          <div className="max-w-4xl mx-auto">
            <form 
              onSubmit={handleSendMessage}
              className="relative flex items-center bg-white border border-gray-300 rounded-xl shadow-sm focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500 transition-all"
            >
              <input
                type="text"
                placeholder="Ask Codexa about the codebase..."
                className="flex-1 bg-transparent py-4 pl-4 pr-14 outline-none text-gray-900 placeholder-gray-400"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isTyping}
              />
              <button
                type="submit"
                disabled={!chatInput.trim() || isTyping}
                className="absolute right-2 p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                <Send size={18} className="ml-0.5" />
              </button>
            </form>
            <div className="text-center mt-3">
              <span className="text-[11px] text-gray-400">Codexa AI can make mistakes. Consider verifying important information.</span>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
};

export default ChatPage;