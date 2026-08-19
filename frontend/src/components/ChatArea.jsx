import React, { useState, useRef, useEffect } from 'react';

const ChatArea = ({ activeSession, messages = [], onSendMessage, loading }) => {
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

  // Helper untuk format waktu dari ISO Date String (e.g., 2026-08-19T10:00:00)
  const formatTime = (dateString) => {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Filter pesan berdasarkan kata kunci pencarian
  const filteredMessages = messages.filter((msg) =>
    (msg.content || '').toLowerCase().includes(searchInChatQuery.toLowerCase())
  );

  // Tampilan state ketika belum ada sesi aktif dipilih
  if (!activeSession) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6">
        <div className="w-16 h-16 bg-slate-200 rounded-full flex items-center justify-center text-3xl mb-4">
          💬
        </div>
        <h2 className="text-lg font-semibold text-slate-700">Tidak Ada Sesi Chat yang Aktif</h2>
        <p className="text-sm text-slate-500 mt-1 max-w-sm text-center">
          Pilih sesi dari riwayat di sidebar atau mulai obrolan baru dengan memilih dokumen / Chatbot Global.
        </p>
      </main>
    );
  }

  const isGlobalMode = !activeSession.document_id;

  return (
    <main className="flex-1 flex flex-col h-full bg-slate-50">
      {/* Header Chat Panel */}
      <header className="h-16 px-6 bg-white border-b border-slate-200 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl">{isGlobalMode ? '🌐' : '📄'}</span>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-slate-800 truncate">
              {activeSession.title || 'New Chat'}
            </h2>
            <p className="text-xs text-slate-500">
              {isGlobalMode
                ? 'Mode: Chatbot Global (Seluruh Dokumen Knowledge Base)'
                : `Mode: Dokumen Spesifik (ID Dokumen: ${activeSession.document_id})`}
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
          <svg
            className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </header>

      {/* Bubble Chat Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {filteredMessages.length > 0 ? (
          filteredMessages.map((msg, index) => {
            const isUser = msg.role === 'user';
            const metadata = msg.metadata || msg.msg_metadata;

            return (
              <div
                key={msg.id || index}
                className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white text-slate-800 border border-slate-200 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Tampilan Sumber Dokumen (RAG Citations/Sources) jika ada */}
                  {!isUser && metadata?.sources && metadata.sources.length > 0 && (
                    <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500">
                      <span className="font-semibold text-slate-600 block mb-1">
                        📚 Sumber Referensi:
                      </span>
                      <ul className="list-disc list-inside space-y-0.5">
                        {metadata.sources.map((src, i) => (
                          <li key={i} className="truncate">
                            {typeof src === 'string'
                              ? src
                              : src.document_title || src.source || 'Dokumen RAG'}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  <p
                    className={`text-[10px] mt-1.5 text-right ${
                      isUser ? 'text-blue-100' : 'text-slate-400'
                    }`}
                  >
                    {formatTime(msg.created_at)}
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
            <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-bl-none text-slate-500 text-xs flex items-center gap-2 shadow-sm">
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.2s]"></span>
              <span className="w-2 h-2 bg-blue-600 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              <span className="ml-1 text-slate-600">AI sedang menganalisis dokumen...</span>
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
            placeholder={`Tanyakan sesuatu tentang ${activeSession.title || 'dokumen'}...`}
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
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M14 5l7 7m0 0l-7 7m7-7H3"
              />
            </svg>
          </button>
        </form>
      </div>
    </main>
  );
};

export default ChatArea;