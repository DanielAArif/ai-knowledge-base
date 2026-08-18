import React, { useState, useRef, useEffect } from 'react';

const ChatArea = ({ activeChat, messages, onSendMessage, loading }) => {
  const [inputText, setInputText] = useState('');
  const [searchInChatQuery, setSearchInChatQuery] = useState('');
  const messagesEndRef = useRef(null);

  // Auto-scroll ke pesan paling bawah setiap kali ada pesan baru
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputText.trim() || loading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  // Filter pesan berdasarkan pencarian kata kunci dalam chat
  const filteredMessages = messages.filter((msg) =>
    msg.text.toLowerCase().includes(searchInChatQuery.toLowerCase())
  );

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header Chat Panel */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{activeChat.type === 'global' ? '🌐' : '📄'}</span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-800 truncate">{activeChat.title}</h2>
            <p className="text-xs text-slate-500">
              {activeChat.type === 'global' ? 'Mode: Chatbot Global (Semua Dokumen)' : 'Mode: Dokumen Spesifik'}
            </p>
          </div>
        </div>

        {/* Search Bar Kata Kunci Dalam Chat Aktif */}
        <div className="relative w-64">
          <input
            type="text"
            value={searchInChatQuery}
            onChange={(e) => setSearchInChatQuery(e.target.value)}
            placeholder="Cari isi percakapan..."
            className="w-full pl-8 pr-3 py-1.5 bg-slate-100 border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
          />
          <svg className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
      </header>

      {/* Bubble Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg, index) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                  <p className={`text-[10px] mt-1.5 text-right ${isUser ? 'text-blue-100' : 'text-slate-400'}`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-2">
            <span className="text-4xl">💬</span>
            <p className="text-sm">Belum ada percakapan. Mulai ajukan pertanyaan!</p>
          </div>
        )}

        {/* Loading Indicator saat AI memproses RAG */}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none text-slate-500 text-xs flex items-center gap-2">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-1">AI sedang menganalisis dokumen...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Footer */}
      <div className="p-4 bg-white border-t border-slate-200">
        <form onSubmit={handleSubmit} className="flex gap-2 max-w-4xl mx-auto">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Tanyakan sesuatu tentang ${activeChat.title}...`}
            disabled={loading}
            className="flex-1 px-4 py-2.5 bg-slate-100 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm"
          >
            <span>Kirim</span>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
};

export default ChatArea;