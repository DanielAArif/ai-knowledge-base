import React from 'react';

const Sidebar = ({
  documents,
  searchDocQuery,
  setSearchDocQuery,
  activeChat,
  setActiveChat,
  onLogout,
  user
}) => {
  // Filter dokumen berdasarkan search bar dokumen
  const filteredDocs = documents.filter((doc) =>
    doc.title.toLowerCase().includes(searchDocQuery.toLowerCase())
  );

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

      {/* Navigasi Utama: Global Chatbot & Daftar Dokumen */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* Tombol Chatbot Global */}
        <button
          onClick={() => setActiveChat({ type: 'global', id: 'global', title: 'Global Knowledge Base' })}
          className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center gap-3 border ${
            activeChat.type === 'global'
              ? 'bg-blue-50 border-blue-200 text-blue-700 font-semibold shadow-sm'
              : 'border-transparent text-slate-700 hover:bg-slate-100'
          }`}
        >
          <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-lg flex-shrink-0">
            🌐
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm truncate">Chatbot Global</p>
            <p className="text-xs text-slate-500 font-normal">Semua Dokumen</p>
          </div>
        </button>

        <div className="pt-2">
          <p className="px-2 text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Daftar Dokumen ({filteredDocs.length})
          </p>

          {/* List Dokumen */}
          <div className="space-y-1">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => {
                const isActive = activeChat.type === 'doc' && activeChat.id === doc.id;
                return (
                  <div
                    key={doc.id}
                    onClick={() => setActiveChat({ type: 'doc', id: doc.id, title: doc.title, fileUrl: doc.fileUrl })}
                    className={`group w-full p-2.5 rounded-xl cursor-pointer transition-all flex items-center justify-between gap-2 border ${
                      isActive
                        ? 'bg-slate-100 border-slate-300 font-medium text-slate-900 shadow-sm'
                        : 'border-transparent text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span className="text-xl">📄</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm truncate">{doc.title}</p>
                        <p className="text-xs text-slate-400">{doc.size}</p>
                      </div>
                    </div>

                    {/* Tombol Unduh Dokumen */}
                    <a
                      href={doc.fileUrl}
                      download
                      onClick={(e) => e.stopPropagation()} // Supaya tidak memicu klik pilih dokumen
                      title="Unduh Dokumen"
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-slate-200"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </a>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-slate-400 text-center py-4">Dokumen tidak ditemukan</p>
            )}
          </div>
        </div>
      </div>

      {/* Footer Sidebar: User Profile & Logout */}
      <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs uppercase">
            {user?.email?.slice(0, 2) || 'US'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-800 truncate">{user?.full_name || 'User'}</p>
            <p className="text-[10px] text-slate-500 truncate">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          title="Keluar"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;