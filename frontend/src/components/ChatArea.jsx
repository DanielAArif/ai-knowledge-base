import React, { useState, useRef, useEffect } from 'react';

const ChatArea = ({ activeSession, messages = [], onSendMessage, sendingMessage }) => {
  const [inputText, setInputText] = useState('');
  const [searchInChatQuery, setSearchInChatQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, sendingMessage]);

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!inputText.trim() || sendingMessage) return;

    onSendMessage(inputText);
    setInputText('');
  };

  const formatTime = (dateString) => {
    if (!dateString) return '';

    try {
      let value = dateString;

      if (
        typeof value === 'string' &&
        !value.endsWith('Z') &&
        !/[+-]\d{2}:\d{2}$/.test(value)
      ) {
        value = `${value}Z`;
      }

      const date = new Date(value);

      if (Number.isNaN(date.getTime())) {
        return '';
      }

      return new Intl.DateTimeFormat('id-ID', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      }).format(date);
    } catch {
      return '';
    }
  };

  const renderFormattedText = (text) => {
    if (!text) return null;

    const parts = String(text).split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <strong key={index}>
            {part.slice(2, -2)}
          </strong>
        );
      }

      return (
        <React.Fragment key={index}>
          {part}
        </React.Fragment>
      );
    });
  };

  const filteredMessages = messages.filter((msg) =>
    (msg.content || '')
      .toLowerCase()
      .includes(searchInChatQuery.toLowerCase())
  );

  if (!activeSession) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-slate-50 dark:bg-neutral-900 text-slate-400 dark:text-slate-500 p-6">
        <div className="w-16 h-16 bg-slate-200 dark:bg-slate-800 rounded-full flex items-center justify-center text-3xl mb-4">
          💬
        </div>

        <h2 className="text-lg font-semibold text-slate-700 dark:text-slate-200">
          Tidak Ada Sesi Chat yang Aktif
        </h2>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm text-center">
          Pilih sesi dari riwayat di sidebar atau mulai obrolan baru dengan
          memilih dokumen / Chatbot Global.
        </p>
      </main>
    );
  }

  const isGlobalMode = !activeSession.document_id;

  const rawTitle = activeSession.title || 'New Chat';

  const displayTitle = rawTitle
    .replace(/^##\s*Chat:\s*/i, '')
    .replace(/^Chat:\s*/i, '')
    .trim();

  return (
    <main className="flex-1 min-w-0 flex flex-col h-full bg-slate-50 dark:bg-neutral-900">

      {/* Header Chat Panel */}
      <header className="h-16 px-6 bg-white dark:bg-neutral-950 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-sm dark:shadow-none z-10">
        <div className="flex items-center gap-3 min-w-0">

          {/* Icon */}
          <div className="w-9 h-9 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center text-lg">
            {isGlobalMode ? '🌐' : '📄'}
          </div>

          {/* Chat Info */}
          <div className="min-w-0">
            <h2
              className="text-sm font-semibold text-slate-800 dark:text-white truncate"
              title={isGlobalMode ? 'Knowledge Base' : displayTitle}
            >
              {isGlobalMode ? 'Knowledge Base' : displayTitle}
            </h2>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isGlobalMode
                ? 'Semua Dokumen'
                : 'Dokumen Spesifik'}
            </p>
          </div>

        </div>

        {/* Search Bar */}
        <div className="relative w-64">
          <input
            type="text"
            value={searchInChatQuery}
            onChange={(e) => setSearchInChatQuery(e.target.value)}
            placeholder="Cari isi percakapan..."
            className="w-full pl-8 pr-3 py-2 bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg text-xs text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-neutral-900"
          />

          <svg
            className="w-4 h-4 text-slate-400 dark:text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              cx="11"
              cy="11"
              r="7"
              strokeWidth="2"
            />
            <path
              d="M20 20L16 16"
              strokeWidth="2"
              strokeLinecap="round"
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
                className={`flex ${
                  isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-sm dark:shadow-none ${
                    isUser
                      ? 'bg-blue-600 text-white rounded-br-none'
                      : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">
                    {renderFormattedText(msg.content)}
                  </p>

                  {/* Sumber Dokumen */}
                  {!isUser &&
                    metadata?.sources &&
                    metadata.sources.length > 0 && (
                      <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-slate-600 dark:text-slate-200 block mb-1">
                          📚 Sumber Referensi:
                        </span>

                        <ul className="list-disc list-inside space-y-0.5">
                          {metadata.sources.map((src, i) => (
                            <li key={i} className="truncate">
                              {typeof src === 'string'
                                ? src
                                : src.document_title ||
                                  src.source ||
                                  'Dokumen RAG'}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {/* Waktu */}
                  <p
                    className={`text-[10px] mt-1.5 text-right ${
                      isUser
                        ? 'text-blue-100'
                        : 'text-slate-400 dark:text-slate-400'
                    }`}
                  >
                    {formatTime(msg.created_at)}
                  </p>
                </div>
              </div>
            );
          })
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 dark:text-slate-500 space-y-2">
            <span className="text-4xl">💬</span>
            <p className="text-sm">
              Belum ada percakapan. Mulai ajukan pertanyaan!
            </p>
          </div>
        )}

        {/* TYPING INDICATOR */}
        {sendingMessage && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 px-4 py-3 rounded-2xl rounded-bl-none shadow-sm dark:shadow-none">

              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 bg-slate-400 dark:bg-slate-400 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-slate-400 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                <span className="w-2 h-2 bg-slate-400 dark:bg-slate-400 rounded-full animate-bounce [animation-delay:0.3s]"></span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Prompt Footer */}
      <div className="p-4 bg-white dark:bg-neutral-950 border-t border-slate-200 dark:border-slate-800">
        <form
          onSubmit={handleSubmit}
          className="flex gap-2 max-w-4xl mx-auto"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={`Tanyakan sesuatu tentang ${
              isGlobalMode ? 'Knowledge Base' : displayTitle
            }...`}
            disabled={sendingMessage}
            className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800/60 border border-slate-300 dark:border-slate-700 rounded-xl text-sm text-slate-800 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-neutral-900 disabled:opacity-50"
          />

          <button
            type="submit"
            disabled={sendingMessage || !inputText.trim()}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2 shadow-sm dark:shadow-none"
          >
            <span>Kirim</span>

            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
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