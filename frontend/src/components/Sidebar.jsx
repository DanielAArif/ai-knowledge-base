import React from 'react';
import api from '../api/axios';
import {
  Bot,
  Download,
  FileText,
  LogOut,
  MessageSquare,
  Search,
  Globe,
  Loader2,
} from 'lucide-react';

const Sidebar = ({
  documents = [],
  loadingDocuments = false,
  searchDocQuery,
  setSearchDocQuery,
  chatSessions = [],
  activeSession,
  setActiveSession,
  onCreateSession,
  onLogout,
  user,
}) => {
  const filteredDocs = documents.filter((doc) => {
    const title = doc.title || doc.filename || '';
    return title.toLowerCase().includes(searchDocQuery.toLowerCase());
  });

  const handleSelectGlobalChat = () => {
    const globalSession = chatSessions.find(
      (s) => s.document_id === null
    );

    if (globalSession) {
      setActiveSession(globalSession);
    } else {
      onCreateSession(null, 'Global Knowledge Base');
    }
  };

  const handleDownload = async (e, docId, docTitle) => {
    e.stopPropagation();

    try {
      const response = await api.get(`/documents/${docId}/download`, {
        responseType: 'blob',
      });

      let filename = '';
      const disposition = response.headers['content-disposition'];

      if (disposition && disposition.includes('filename=')) {
        const filenameMatch = disposition.match(/filename="?([^";]+)"?/);

        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      if (!filename) {
        filename = docTitle || `document-${docId}`;
      }

      const contentType = response.headers['content-type'] || '';

      if (
        contentType.includes('wordprocessingml') ||
        contentType.includes('docx')
      ) {
        if (!filename.toLowerCase().endsWith('.docx')) {
          filename = `${filename}.docx`;
        }
      } else if (contentType.includes('pdf')) {
        if (!filename.toLowerCase().endsWith('.pdf')) {
          filename = `${filename}.pdf`;
        }
      }

      const blob = new Blob([response.data], {
        type: contentType || 'application/octet-stream',
      });

      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');

      link.href = downloadUrl;
      link.setAttribute('download', filename);

      document.body.appendChild(link);
      link.click();

      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Gagal mengunduh dokumen:', error);
      alert('Gagal mengunduh dokumen.');
    }
  };

  const handleSelectDocument = (doc) => {
    const existingSession = chatSessions.find(
      (s) => s.document_id === doc.id
    );

    if (existingSession) {
      setActiveSession(existingSession);
    } else {
      onCreateSession(
        doc.id,
        `Chat: ${doc.title || doc.filename}`
      );
    }
  };

  return (
    <aside className="flex h-full w-80 flex-shrink-0 flex-col border-r border-slate-200 bg-white dark:border-neutral-800 dark:bg-neutral-900 select-none">
      <div className="border-b border-slate-200 bg-white px-4 py-4 dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-white">
            <Bot className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <h1 className="truncate text-sm font-bold text-slate-900 dark:text-neutral-100">
              Knowledge Base
            </h1>
            <p className="text-xs text-slate-500 dark:text-neutral-400">
              AI Document Assistant
            </p>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />

          <input
            type="text"
            value={searchDocQuery}
            onChange={(e) => setSearchDocQuery(e.target.value)}
            placeholder="Cari dokumen..."
            className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-200 dark:placeholder:text-neutral-500 dark:focus:bg-neutral-800"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4">
        <div className="mb-5">
          <button
            onClick={handleSelectGlobalChat}
            className={`flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
              activeSession?.document_id === null
                ? 'border-blue-200 bg-blue-50 text-blue-700 shadow-sm dark:border-blue-900/60 dark:bg-blue-950/30 dark:text-blue-400'
                : 'border-transparent text-slate-700 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-800'
            }`}
          >
            <div
              className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg ${
                activeSession?.document_id === null
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400'
              }`}
            >
              <Globe className="h-4 w-4" />
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">
                Chatbot Global
              </p>
              <p className="truncate text-xs font-normal text-slate-500 dark:text-neutral-500">
                Semua Dokumen KB
              </p>
            </div>
          </button>
        </div>

        <div>
          <div className="mb-2 flex items-center justify-between px-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
              Dokumen ({filteredDocs.length})
            </p>

            {loadingDocuments && (
              <Loader2 className="h-3.5 w-3.5 animate-spin text-blue-600" />
            )}
          </div>

          <div className="space-y-1">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => {
                const isActive =
                  activeSession?.document_id === doc.id;

                const docTitle =
                  doc.title ||
                  doc.filename ||
                  `Dokumen #${doc.id}`;

                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc)}
                    className={`group flex w-full cursor-pointer items-center gap-2 rounded-xl border p-2.5 transition-all ${
                      isActive
                        ? 'border-slate-200 bg-slate-100 text-slate-900 shadow-sm dark:border-neutral-700 dark:bg-neutral-800 dark:text-neutral-100'
                        : 'border-transparent text-slate-700 hover:bg-slate-50 dark:text-neutral-300 dark:hover:bg-neutral-800/70'
                    }`}
                  >
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                        isActive
                          ? 'bg-white text-blue-600 dark:bg-neutral-700'
                          : 'bg-slate-100 text-slate-500 dark:bg-neutral-800 dark:text-neutral-400'
                      }`}
                    >
                      <FileText className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {docTitle}
                      </p>

                      {(doc.file_size || doc.size) && (
                        <p className="mt-0.5 truncate text-[11px] text-slate-400 dark:text-neutral-500">
                          {doc.file_size || doc.size}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={(e) =>
                        handleDownload(e, doc.id, docTitle)
                      }
                      title="Unduh Dokumen"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg border border-transparent text-slate-400 opacity-0 transition-all hover:border-slate-200 hover:bg-white hover:text-blue-600 group-hover:opacity-100 dark:hover:border-neutral-700 dark:hover:bg-neutral-700"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="px-2 py-8 text-center">
                <div className="mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-400 dark:bg-neutral-800 dark:text-neutral-500">
                  <FileText className="h-4 w-4" />
                </div>

                <p className="text-xs text-slate-400 dark:text-neutral-500">
                  {loadingDocuments
                    ? 'Memuat dokumen...'
                    : 'Dokumen tidak ditemukan'}
                </p>
              </div>
            )}
          </div>
        </div>

        {chatSessions.length > 0 && (
          <div className="mt-5 border-t border-slate-100 pt-4 dark:border-neutral-800">
            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 dark:text-neutral-500">
                Riwayat Obrolan
              </p>

              <span className="text-[10px] text-slate-400 dark:text-neutral-600">
                {chatSessions.length}
              </span>
            </div>

            <div className="space-y-1">
              {chatSessions.map((session) => {
                const isSelected =
                  activeSession?.id === session.id;

                return (
                  <button
                    key={session.id}
                    onClick={() => setActiveSession(session)}
                    className={`flex w-full items-center gap-2 rounded-lg p-2.5 text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-950/30 dark:text-blue-400'
                        : 'text-slate-600 hover:bg-slate-50 dark:text-neutral-400 dark:hover:bg-neutral-800'
                    }`}
                  >
                    {session.document_id ? (
                      <FileText className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <Globe className="h-3.5 w-3.5 flex-shrink-0" />
                    )}

                    <span className="truncate">
                      {session.title || 'New Chat'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {user?.role !== 'admin' && (
        <div className="border-t border-slate-200 bg-white p-3 dark:border-neutral-800 dark:bg-neutral-900">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-slate-700 text-xs font-bold uppercase text-white">
              {user?.email?.slice(0, 2) || 'US'}
            </div>

            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold text-slate-800 dark:text-neutral-200">
                {user?.full_name || 'User'}
              </p>

              <p className="truncate text-[10px] text-slate-500 dark:text-neutral-500">
                {user?.email}
              </p>
            </div>

            <button
              onClick={onLogout}
              title="Keluar"
              className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
