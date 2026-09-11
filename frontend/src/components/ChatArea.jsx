import React, { useEffect, useRef, useState } from 'react';
import {
  Bot,
  FileText,
  Globe,
  MessageSquare,
  Search,
  Send,
  User,
} from 'lucide-react';

const ChatArea = ({
  activeSession,
  messages = [],
  onSendMessage,
  sendingMessage,
}) => {
  const [inputText, setInputText] = useState('');
  const [searchInChatQuery, setSearchInChatQuery] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth',
    });
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
      const date = new Date(dateString);

      return date.toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '';
    }
  };

  const filteredMessages = messages.filter((msg) =>
    (msg.content || '')
      .toLowerCase()
      .includes(searchInChatQuery.toLowerCase())
  );

  if (!activeSession) {
    return (
      <main className="flex h-full flex-1 flex-col items-center justify-center bg-slate-50 p-6 dark:bg-neutral-950">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-800">
          <MessageSquare className="h-7 w-7" />
        </div>

        <h2 className="text-lg font-semibold text-slate-800 dark:text-neutral-200">
          Tidak Ada Sesi Chat yang Aktif
        </h2>

        <p className="mt-1 max-w-sm text-center text-sm text-slate-500 dark:text-neutral-500">
          Pilih sesi dari sidebar atau mulai obrolan baru
          dengan memilih dokumen atau Chatbot Global.
        </p>
      </main>
    );
  }

  const isGlobalMode = !activeSession.document_id;

  return (
    <main className="flex h-full flex-1 flex-col bg-slate-50 dark:bg-neutral-950">
      <header className="z-10 flex min-h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
        <div className="flex min-w-0 items-center gap-3">
          <div
            className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
              isGlobalMode
                ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400'
                : 'bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-400'
            }`}
          >
            {isGlobalMode ? (
              <Globe className="h-4 w-4" />
            ) : (
              <FileText className="h-4 w-4" />
            )}
          </div>

          <div className="min-w-0">
            <h2 className="truncate text-sm font-semibold text-slate-900 dark:text-neutral-100">
              {activeSession.title || 'New Chat'}
            </h2>

            <p className="truncate text-xs text-slate-500 dark:text-neutral-500">
              {isGlobalMode
                ? 'Chatbot Global · Seluruh Dokumen Knowledge Base'
                : `Dokumen Spesifik · ID Dokumen: ${activeSession.document_id}`}
            </p>
          </div>
        </div>

        <div className="relative hidden w-64 sm:block">
          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />

          <input
            type="text"
            value={searchInChatQuery}
            onChange={(e) =>
              setSearchInChatQuery(e.target.value)
            }
            placeholder="Cari isi percakapan..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-8 pr-3 text-xs text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:bg-neutral-800"
          />
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
        <div className="mx-auto max-w-4xl space-y-5">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg, index) => {
              const isUser = msg.role === 'user';
              const metadata =
                msg.metadata || msg.msg_metadata;

              return (
                <div
                  key={msg.id || index}
                  className={`flex gap-3 ${
                    isUser ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {!isUser && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                      <Bot className="h-4 w-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-2xl ${
                      isUser ? 'order-first' : ''
                    }`}
                  >
                    <div
                      className={`rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm ${
                        isUser
                          ? 'rounded-br-md bg-blue-600 text-white'
                          : 'rounded-bl-md border border-slate-200 bg-white text-slate-800 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200'
                      }`}
                    >
                      <p className="whitespace-pre-wrap">
                        {msg.content}
                      </p>

                      {!isUser &&
                        metadata?.sources &&
                        metadata.sources.length > 0 && (
                          <div className="mt-3 border-t border-slate-100 pt-3 dark:border-neutral-800">
                            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-neutral-400">
                              <FileText className="h-3.5 w-3.5" />
                              Sumber Referensi
                            </div>

                            <div className="space-y-1.5">
                              {metadata.sources.map((src, i) => (
                                <div
                                  key={i}
                                  className="flex items-start gap-2 rounded-md bg-slate-50 px-2.5 py-1.5 text-xs text-slate-500 dark:bg-neutral-800 dark:text-neutral-400"
                                >
                                  <span className="mt-0.5 text-[10px] text-slate-400">
                                    {i + 1}.
                                  </span>

                                  <span className="truncate">
                                    {typeof src === 'string'
                                      ? src
                                      : src.document_title ||
                                        src.source ||
                                        'Dokumen RAG'}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      <p
                        className={`mt-2 text-right text-[10px] ${
                          isUser
                            ? 'text-blue-100'
                            : 'text-slate-400 dark:text-neutral-600'
                        }`}
                      >
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>

                  {isUser && (
                    <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-white shadow-sm dark:bg-neutral-700">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
              );
            })
          ) : (
            <div className="flex h-full min-h-[300px] flex-col items-center justify-center text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-white text-slate-400 shadow-sm ring-1 ring-slate-200 dark:bg-neutral-900 dark:text-neutral-500 dark:ring-neutral-800">
                <MessageSquare className="h-5 w-5" />
              </div>

              <p className="text-sm font-medium text-slate-600 dark:text-neutral-400">
                Belum ada percakapan
              </p>

              <p className="mt-1 text-xs text-slate-400 dark:text-neutral-600">
                Mulai ajukan pertanyaan tentang knowledge base.
              </p>
            </div>
          )}

          {sendingMessage && (
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-blue-600 text-white shadow-sm">
                <Bot className="h-4 w-4" />
              </div>

              <div className="rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
                <div className="flex items-center gap-1.5">
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.15s]" />
                  <span className="h-2 w-2 animate-bounce rounded-full bg-slate-400 [animation-delay:0.3s]" />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-slate-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-4xl items-end gap-2"
        >
          <div className="relative flex-1">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder={`Tanyakan sesuatu tentang ${
                activeSession.title || 'dokumen'
              }...`}
              disabled={sendingMessage}
              className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 pr-4 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:bg-neutral-800"
            />
          </div>

          <button
            type="submit"
            disabled={sendingMessage || !inputText.trim()}
            className="flex h-11 items-center gap-2 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span className="hidden sm:inline">
              {sendingMessage ? 'Mengirim...' : 'Kirim'}
            </span>

            <Send className="h-4 w-4" />
          </button>
        </form>

        <p className="mx-auto mt-2 max-w-4xl text-center text-[10px] text-slate-400 dark:text-neutral-600">
          Jawaban AI dibuat berdasarkan dokumen yang tersedia di
          Knowledge Base.
        </p>
      </div>
    </main>
  );
};

export default ChatArea;