import React from 'react';
import api from '../api/axios';

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
  // Filter dokumen berdasarkan nama file/title
  const filteredDocs = documents.filter((doc) => {
    const title = doc.title || doc.filename || '';
    return title.toLowerCase().includes(searchDocQuery.toLowerCase());
  });

  // Handler saat mengklik Chatbot Global
  const handleSelectGlobalChat = () => {
    const globalSession = chatSessions.find((s) => s.document_id === null);
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
        responseType: 'blob', // WAJIB: memberitahu axios agar merespon sebagai binary blob
      });

      // 1. Ambil nama file dari header Content-Disposition jika ada
      let filename = '';
      const disposition = response.headers['content-disposition'];
      
      if (disposition && disposition.includes('filename=')) {
        const filenameMatch = disposition.match(/filename="?([^";]+)"?/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1];
        }
      }

      // 2. Jika nama file dari header tidak ketemu, buat nama fallback manual
      if (!filename) {
        filename = docTitle || `document-${docId}`;
      }

      // 3. KUNCI UTAMA: Pastikan nama file berakhiran .docx (jika file docx)
      // Cek content-type dari server
      const contentType = response.headers['content-type'] || '';
      
      if (contentType.includes('wordprocessingml') || contentType.includes('docx')) {
        if (!filename.toLowerCase().endsWith('.docx')) {
          filename = `${filename}.docx`;
        }
      } else if (contentType.includes('pdf')) {
        if (!filename.toLowerCase().endsWith('.pdf')) {
          filename = `${filename}.pdf`;
        }
      }

      // 4. Buat Object URL dengan Content Type yang sesuai dari response server
      const blob = new Blob([response.data], {
        type: contentType || 'application/octet-stream',
      });
      
      const downloadUrl = window.URL.createObjectURL(blob);

      // 5. Pemicu Download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.setAttribute('download', filename); // Properti ini yang menentukan nama & ekstensi di browser
      document.body.appendChild(link);
      link.click();

      // 6. Cleanup
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Gagal mengunduh dokumen:', error);
      alert('Gagal mengunduh dokumen.');
    }
  };

  // Handler saat mengklik dokumen spesifik
  const handleSelectDocument = (doc) => {
    const existingSession = chatSessions.find((s) => s.document_id === doc.id);
    if (existingSession) {
      setActiveSession(existingSession);
    } else {
      onCreateSession(doc.id, `Chat: ${doc.title || doc.filename}`);
    }
  };

  return (
    <aside className="w-80 border-r border-slate-200 bg-white flex flex-col h-full select-none">
      {/* Header Sidebar & Search Bar Dokumen */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-slate-50">
        <h1 className="text-lg font-bold text-slate-800">Knowledge Base</h1>
        <div className="relative">
          <input
            type="text"
            value={searchDocQuery}
            onChange={(e) => setSearchDocQuery(e.target.value)}
            placeholder="Cari dokumen..."
            className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <svg
            className="w-4 h-4 text-slate-400 absolute left-3 top-3"
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
      </div>

      {/* Navigasi Utama: Global Chatbot & Daftar Dokumen / Sesi */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Tombol Chatbot Global */}
        <div>
          <button
            onClick={handleSelectGlobalChat}
            className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 border ${
              activeSession && activeSession.document_id === null
                ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-sm'
                : 'border-transparent text-slate-700 hover:bg-slate-100'
            }`}
          >
            <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
              🌐
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm truncate">Chatbot Global</p>
              <p className="text-xs text-slate-500 font-normal">Semua Dokumen KB</p>
            </div>
          </button>
        </div>

        {/* Seksi Daftar Dokumen KB */}
        <div>
          <div className="flex items-center justify-between px-2 mb-2">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Daftar Dokumen ({filteredDocs.length})
            </p>
            {loadingDocuments && (
              <span className="text-[10px] text-blue-600 animate-pulse">Memuat...</span>
            )}
          </div>

          <div className="space-y-1">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => {
                const isActive = activeSession?.document_id === doc.id;
                const docTitle = doc.title || doc.filename || `Dokumen #${doc.id}`;
                // Mendukung berbagai format penamaan properti URL file
                const downloadUrl = doc.file_url || doc.fileUrl || doc.url || '#';

                return (
                  <div
                    key={doc.id}
                    onClick={() => handleSelectDocument(doc)}
                    className={`group w-full p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                      isActive
                        ? 'bg-slate-100 border-slate-300 font-medium text-slate-900 shadow-sm'
                        : 'border-transparent text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xl flex-shrink-0">📄</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{docTitle}</p>
                        {(doc.file_size || doc.size) && (
                          <p className="text-xs text-slate-400">
                            {doc.file_size || doc.size}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Tombol Unduh Dokumen */}
                    <button
                      type="button"
                      onClick={(e) => handleDownload(e, doc.id, docTitle)}
                      title="Unduh Dokumen"
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200 flex-shrink-0"
                    >
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
                          d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                        />
                      </svg>
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-3">
                {loadingDocuments ? 'Memuat dokumen...' : 'Dokumen tidak ditemukan'}
              </p>
            )}
          </div>
        </div>

        {/* Seksi Riwayat Sesi Chat */}
        {chatSessions.length > 0 && (
          <div className="pt-2 border-t border-slate-100">
            <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Riwayat Obrolan ({chatSessions.length})
            </p>
            <div className="space-y-1">
              {chatSessions.map((session) => {
                const isSelected = activeSession?.id === session.id;
                return (
                  <button
                    key={session.id}
                    onClick={() => setActiveSession(session)}
                    className={`w-full text-left p-2 rounded-lg text-xs transition-colors flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-blue-100/70 text-blue-800 font-semibold'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span className="truncate flex-1">
                      {session.document_id ? '📄' : '🌐'} {session.title || 'New Chat'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer Sidebar: User Profile & Logout */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase flex-shrink-0">
            {user?.email?.slice(0, 2) || 'US'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">
              {user?.full_name || 'User'}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors flex-shrink-0"
          title="Keluar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
            />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;