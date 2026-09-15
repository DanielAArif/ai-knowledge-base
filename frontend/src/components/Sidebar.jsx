import { useState } from 'react';
import api from '../api/axios';

const Sidebar = ({
  documents = [],
  loadingDocuments = false,
  searchDocQuery = '',
  setSearchDocQuery,
  chatSessions = [],
  activeSession,
  setActiveSession,
  onCreateSession,
  onLogout,
  user,
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [documentLimit, setDocumentLimit] = useState(20);
  const [chatLimit, setChatLimit] = useState(20);

  // ============================================================
  // FILTER DOKUMEN
  // ============================================================

  /*
   * Hanya dokumen yang sudah selesai indexing
   * yang boleh digunakan untuk document-specific chat.
   */
  const filteredDocuments = documents.filter((doc) => {
    const status = String(
      doc.status || ''
    ).toLowerCase();

    if (status !== 'completed') {
      return false;
    }

    const query = searchDocQuery.toLowerCase();

    return (
      doc.title?.toLowerCase().includes(query) ||
      doc.filename?.toLowerCase().includes(query)
    );
  });

  const visibleDocuments =
    filteredDocuments.slice(
      0,
      documentLimit
    );

  const visibleChatSessions =
    chatSessions.slice(
      0,
      chatLimit
    );

  // ============================================================
  // CREATE / OPEN GLOBAL CHAT
  // ============================================================

  const handleCreateGlobalChat = async () => {
    const session = await onCreateSession(
      null,
      'Global Chat'
    );

    if (session) {
      setActiveSession(session);
    }
  };

  // ============================================================
  // OPEN DOCUMENT CHAT
  // ============================================================

  const handleCreateDocumentChat = async (
    documentId
  ) => {
    /*
     * Backend otomatis membuat document-specific
     * ChatSession setelah indexing dokumen selesai.
     *
     * Oleh karena itu, cari session yang sudah ada
     * terlebih dahulu agar tidak membuat duplicate session.
     */
    const existingSession =
      chatSessions.find(
        (session) =>
          String(session.document_id) ===
          String(documentId)
      );

    if (existingSession) {
      setActiveSession(existingSession);
      return;
    }

    /*
     * Fallback:
     * Jika session belum tersedia di state frontend,
     * minta backend membuat session.
     *
     * Backend tetap melakukan validasi bahwa
     * dokumen harus berstatus COMPLETED.
     */
    const session =
      await onCreateSession(documentId);

    if (session) {
      setActiveSession(session);
    }
  };

  // ============================================================
  // DOWNLOAD DOCUMENT
  // ============================================================

  const handleDownload = async (
    e,
    documentId,
    documentTitle
  ) => {
    e.stopPropagation();

    try {
      const response = await api.get(
        `/documents/${documentId}/download`,
        {
          responseType: 'blob',
        }
      );

      let filename = '';

      const disposition =
        response.headers[
          'content-disposition'
        ];

      if (
        disposition &&
        disposition.includes(
          'filename='
        )
      ) {
        const filenameMatch =
          disposition.match(
            /filename="?([^";]+)"?/
          );

        if (
          filenameMatch &&
          filenameMatch[1]
        ) {
          filename =
            filenameMatch[1];
        }
      }

      if (!filename) {
        filename =
          documentTitle ||
          `document-${documentId}`;
      }

      const contentType =
        response.headers[
          'content-type'
        ] || '';

      if (
        contentType.includes(
          'wordprocessingml'
        ) ||
        contentType.includes('docx')
      ) {
        if (
          !filename
            .toLowerCase()
            .endsWith('.docx')
        ) {
          filename = `${filename}.docx`;
        }
      } else if (
        contentType.includes('pdf')
      ) {
        if (
          !filename
            .toLowerCase()
            .endsWith('.pdf')
        ) {
          filename = `${filename}.pdf`;
        }
      }

      const blob = new Blob(
        [response.data],
        {
          type:
            contentType ||
            'application/octet-stream',
        }
      );

      const downloadUrl =
        window.URL.createObjectURL(
          blob
        );

      const link =
        document.createElement('a');

      link.href = downloadUrl;

      link.setAttribute(
        'download',
        filename
      );

      document.body.appendChild(
        link
      );

      link.click();

      link.parentNode.removeChild(
        link
      );

      window.URL.revokeObjectURL(
        downloadUrl
      );
    } catch (error) {
      console.error(
        'Gagal mengunduh dokumen:',
        error
      );
    }
  };

  // ============================================================
  // TOOLTIP
  // ============================================================

  const Tooltip = ({ text }) => {
    if (!isCollapsed) {
      return null;
    }

    return (
      <div
        className="
          absolute
          left-full
          top-1/2
          -translate-y-1/2
          ml-3
          z-[100]
          whitespace-nowrap
          rounded-lg
          bg-blue-600
          px-3
          py-2
          text-xs
          font-medium
          text-white
          shadow-lg
          opacity-0
          pointer-events-none
          group-hover:opacity-100
          transition-opacity
          duration-200
        "
      >
        {text}
      </div>
    );
  };

  return (
    <aside
      className={`
        relative
        shrink-0
        h-full
        border-r
        border-slate-200
        dark:border-slate-800
        bg-white
        dark:bg-neutral-950
        flex
        flex-col
        select-none
        overflow-hidden
        transition-[width]
        duration-300
        ease-in-out
        ${
          isCollapsed
            ? 'w-16'
            : 'w-80'
        }
      `}
    >
      {/* =========================
          HEADER
      ========================== */}

      <div
        className={`
          h-16
          shrink-0
          border-b
          border-slate-200
          dark:border-slate-800
          flex
          items-center
          ${
            isCollapsed
              ? 'justify-center'
              : 'justify-between px-4'
          }
        `}
      >
        {!isCollapsed && (
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="
                w-9
                h-9
                rounded-xl
                bg-blue-600
                flex
                items-center
                justify-center
                shrink-0
              "
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M12 2a10 10 0 1 0 10 10" />
                <path d="M12 6v6l4 2" />
              </svg>
            </div>

            <div className="min-w-0">
              <h2 className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                AI Assistant
              </h2>

              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                Dokumen & Chat
              </p>
            </div>
          </div>
        )}

        <div className="relative group">
          <button
            type="button"
            onClick={() =>
              setIsCollapsed(
                (prev) => !prev
              )
            }
            className="
              w-9
              h-9
              rounded-lg
              flex
              items-center
              justify-center
              text-slate-500
              dark:text-slate-400
              hover:bg-slate-100
              dark:hover:bg-slate-800
              hover:text-slate-900
              dark:hover:text-white
              transition-colors
            "
            aria-label={
              isCollapsed
                ? 'Perbesar sidebar'
                : 'Perkecil sidebar'
            }
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="transition-transform duration-300"
            >
              {isCollapsed ? (
                <>
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                  />
                  <path d="M9 4v16" />
                  <path d="m13 9 3 3-3 3" />
                </>
              ) : (
                <>
                  <rect
                    x="3"
                    y="4"
                    width="18"
                    height="16"
                    rx="2"
                  />
                  <path d="M9 4v16" />
                  <path d="m15 9-3 3 3 3" />
                </>
              )}
            </svg>
          </button>

          <Tooltip
            text={
              isCollapsed
                ? 'Perbesar sidebar'
                : 'Perkecil sidebar'
            }
          />
        </div>
      </div>

      {/* =========================
          COLLAPSED NAVIGATION
      ========================== */}

      {isCollapsed ? (
        <div className="flex-1 flex flex-col items-center py-4 gap-2">
          {/* Search */}

          <div className="relative group">
            <button
              type="button"
              onClick={() => {
                setIsCollapsed(false);

                setTimeout(() => {
                  setShowSearch(true);
                }, 300);
              }}
              className="
                w-10
                h-10
                rounded-lg
                flex
                items-center
                justify-center
                text-slate-500
                dark:text-slate-400
                hover:bg-slate-100
                dark:hover:bg-slate-800
                hover:text-slate-900
                dark:hover:text-white
                transition-colors
              "
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />
                <path d="m20 20-4-4" />
              </svg>
            </button>

            <Tooltip text="Cari dokumen" />
          </div>

          {/* Global Chat */}

          <div className="relative group">
            <button
              type="button"
              onClick={
                handleCreateGlobalChat
              }
              className={`
                w-10
                h-10
                rounded-lg
                flex
                items-center
                justify-center
                transition-colors
                ${
                  !activeSession?.document_id
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-500 dark:text-slate-400 hover:bg-blue-100 dark:hover:bg-blue-500/10 hover:text-slate-900 dark:hover:text-white'
                }
              `}
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 8.7 8.7 0 0 1-4-.9L3 21l1.5-4.5A8.5 8.5 0 1 1 21 11.5Z" />
              </svg>
            </button>

            <Tooltip text="Global Chat" />
          </div>

          {/* Documents */}

          <div className="relative group">
            <button
              type="button"
              onClick={() =>
                setIsCollapsed(false)
              }
              className="
                w-10
                h-10
                rounded-lg
                flex
                items-center
                justify-center
                text-slate-500
                dark:text-slate-400
                hover:bg-blue-100
                dark:hover:bg-blue-500/10
                hover:text-slate-900
                dark:hover:text-white
                transition-colors
              "
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
                <path d="M14 2v6h6" />
                <path d="M8 13h8" />
                <path d="M8 17h5" />
              </svg>
            </button>

            <Tooltip text="Dokumen" />
          </div>

          {/* Chat History */}

          <div className="relative group">
            <button
              type="button"
              onClick={() =>
                setIsCollapsed(false)
              }
              className="
                w-10
                h-10
                rounded-lg
                flex
                items-center
                justify-center
                text-slate-500
                dark:text-slate-400
                hover:bg-blue-100
                dark:hover:bg-blue-500/10
                hover:text-slate-900
                dark:hover:text-white
                transition-colors
              "
            >
              <svg
                width="19"
                height="19"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="9"
                />
                <path d="M12 7v5l3 2" />
              </svg>
            </button>

            <Tooltip text="Riwayat Chat" />
          </div>
        </div>
      ) : (
        /* =========================
           EXPANDED CONTENT
        ========================== */

        <div className="flex-1 overflow-y-auto p-3 space-y-4">
          {/* Search */}

          <div>
            <div className="relative">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle
                  cx="11"
                  cy="11"
                  r="7"
                />
                <path d="m20 20-4-4" />
              </svg>

              <input
                type="text"
                value={searchDocQuery}
                onChange={(e) => {
                  setSearchDocQuery(
                    e.target.value
                  );

                  setDocumentLimit(20);
                }}
                placeholder="Cari dokumen..."
                className="
                  w-full
                  h-10
                  rounded-lg
                  border
                  border-blue-100
                  dark:border-slate-700
                  bg-slate-50
                  dark:bg-slate-800/50
                  pl-9
                  pr-3
                  text-sm
                  text-slate-700
                  dark:text-slate-200
                  placeholder:text-slate-400
                  dark:placeholder:text-slate-500
                  outline-none
                  focus:border-blue-400
                  dark:focus:border-blue-500
                  focus:ring-2
                  focus:ring-blue-100
                  dark:focus:ring-blue-500/20
                  focus:bg-white
                  dark:focus:bg-neutral-900
                  transition-colors
                "
              />
            </div>
          </div>

          {/* Global Chat */}

          <section>
            <button
              type="button"
              onClick={
                handleCreateGlobalChat
              }
              className="
                w-full
                flex
                items-center
                gap-3
                rounded-xl
                px-3
                py-2.5
                text-left
                bg-blue-600
                text-white
                hover:bg-blue-700
                transition-colors
              "
            >
              <div
                className="
                  w-8
                  h-8
                  rounded-lg
                  bg-white/10
                  flex
                  items-center
                  justify-center
                  shrink-0
                "
              >
                <svg
                  width="17"
                  height="17"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 8.7 8.7 0 0 1-4-.9L3 21l1.5-4.5A8.5 8.5 0 1 1 21 11.5Z" />
                </svg>
              </div>

              <div className="min-w-0">
                <p className="text-sm font-medium truncate">
                  Global Chat
                </p>

                <p className="text-[11px] text-slate-300 truncate">
                  Tanya semua dokumen
                </p>
              </div>
            </button>
          </section>

          {/* Documents */}

          <section>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Dokumen
              </h3>

              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {filteredDocuments.length}
              </span>
            </div>

            {loadingDocuments ? (
              <div className="space-y-2">
                {[1, 2, 3].map(
                  (item) => (
                    <div
                      key={item}
                      className="h-12 rounded-lg bg-slate-100 dark:bg-slate-800 animate-pulse"
                    />
                  )
                )}
              </div>
            ) : filteredDocuments.length ===
              0 ? (
              <div className="px-2 py-4 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Tidak ada dokumen
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  {visibleDocuments.map(
                    (doc) => {
                      const isActive =
                        String(
                          activeSession?.document_id
                        ) ===
                        String(doc.id);

                      return (
                        <div
                          key={doc.id}
                          className={`
                            group
                            relative
                            rounded-lg
                            transition-colors
                            ${
                              isActive
                                ? 'bg-blue-100 dark:bg-blue-500/10'
                                : 'hover:bg-blue-100 dark:hover:bg-blue-500/10'
                            }
                          `}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              handleCreateDocumentChat(
                                doc.id
                              )
                            }
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-left"
                          >
                            <div
                              className="
                                w-8
                                h-8
                                rounded-lg
                                bg-slate-100
                                dark:bg-slate-800
                                border
                                border-slate-200
                                dark:border-slate-700
                                flex
                                items-center
                                justify-center
                                shrink-0
                                group-hover:bg-white
                                dark:group-hover:bg-neutral-900
                              "
                            >
                              <svg
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                className="text-slate-500 dark:text-slate-400"
                              >
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2h12a2 2 0 0 0 2-2V8Z" />
                                <path d="M14 2v6h6" />
                              </svg>
                            </div>

                            <div className="min-w-0 flex-1">
                              <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                                {doc.title ||
                                  doc.filename}
                              </p>

                              {doc.title &&
                                doc.filename && (
                                  <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                    {
                                      doc.filename
                                    }
                                  </p>
                                )}
                            </div>
                          </button>

                          {/* Download */}

                          <button
                            type="button"
                            onClick={(e) =>
                              handleDownload(
                                e,
                                doc.id,
                                doc.filename ||
                                  doc.title
                              )
                            }
                            className="
                              absolute
                              right-2
                              top-1/2
                              -translate-y-1/2
                              w-7
                              h-7
                              rounded-md
                              flex
                              items-center
                              justify-center
                              text-slate-400
                              dark:text-slate-500
                              opacity-0
                              group-hover:opacity-100
                              hover:bg-white
                              dark:hover:bg-neutral-900
                              hover:text-slate-700
                              dark:hover:text-slate-200
                              transition-all
                            "
                            title="Download dokumen"
                          >
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M12 3v12" />
                              <path d="m7 10 5 5 5-5" />
                              <path d="M5 21h14" />
                            </svg>
                          </button>
                        </div>
                      );
                    }
                  )}
                </div>

                {/* Document pagination */}

                {visibleDocuments.length <
                filteredDocuments.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDocumentLimit(
                        (prev) =>
                          prev + 20
                      )
                    }
                    className="
                      w-full
                      mt-2
                      py-2
                      rounded-lg
                      text-xs
                      font-medium
                      text-blue-600
                      dark:text-blue-400
                      hover:bg-blue-50
                      dark:hover:bg-blue-500/10
                      transition-colors
                    "
                  >
                    Muat lebih banyak
                  </button>
                ) : documentLimit > 20 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setDocumentLimit(20)
                    }
                    className="
                      w-full
                      mt-2
                      py-2
                      rounded-lg
                      text-xs
                      font-medium
                      text-slate-500
                      dark:text-slate-400
                      hover:bg-slate-100
                      dark:hover:bg-slate-800
                      transition-colors
                    "
                  >
                    Tampilkan lebih sedikit
                  </button>
                ) : null}
              </>
            )}
          </section>

          {/* Chat History */}

          <section>
            <div className="flex items-center justify-between px-1 mb-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                Riwayat Chat
              </h3>

              <span className="text-[11px] text-slate-400 dark:text-slate-500">
                {chatSessions.length}
              </span>
            </div>

            {chatSessions.length === 0 ? (
              <div className="px-2 py-4 text-center">
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Belum ada riwayat chat
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-1">
                  {visibleChatSessions.map(
                    (session) => {
                      const isActive =
                        activeSession?.id ===
                        session.id;

                      return (
                        <button
                          key={session.id}
                          type="button"
                          onClick={() =>
                            setActiveSession(
                              session
                            )
                          }
                          className={`
                            w-full
                            flex
                            items-center
                            gap-3
                            rounded-lg
                            px-3
                            py-2.5
                            text-left
                            transition-colors
                            ${
                              isActive
                                ? 'bg-blue-50 dark:bg-blue-500/10'
                                : 'hover:bg-blue-50/70 dark:hover:bg-blue-500/5'
                            }
                          `}
                        >
                          <div
                            className="
                              w-8
                              h-8
                              rounded-lg
                              flex
                              items-center
                              justify-center
                              shrink-0
                              bg-slate-100
                              dark:bg-slate-800
                              text-slate-500
                              dark:text-slate-400
                            "
                          >
                            <svg
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 8.7 8.7 0 0 1-4-.9L3 21l1.5-4.5A8.5 8.5 0 1 1 21 11.5Z" />
                            </svg>
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-sm text-slate-700 dark:text-slate-200 truncate">
                              {session.title ||
                                'Chat Session'}
                            </p>

                            {session.created_at && (
                              <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                                {new Date(
                                  session.created_at
                                ).toLocaleDateString(
                                  'id-ID'
                                )}
                              </p>
                            )}
                          </div>
                        </button>
                      );
                    }
                  )}
                </div>

                {/* Chat pagination */}

                {visibleChatSessions.length <
                chatSessions.length ? (
                  <button
                    type="button"
                    onClick={() =>
                      setChatLimit(
                        (prev) =>
                          prev + 20
                      )
                    }
                    className="
                      w-full
                      mt-2
                      py-2
                      rounded-lg
                      text-xs
                      font-medium
                      text-blue-600
                      dark:text-blue-400
                      hover:bg-blue-50
                      dark:hover:bg-blue-500/10
                      transition-colors
                    "
                  >
                    Muat lebih banyak
                  </button>
                ) : chatLimit > 20 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setChatLimit(20)
                    }
                    className="
                      w-full
                      mt-2
                      py-2
                      rounded-lg
                      text-xs
                      font-medium
                      text-slate-500
                      dark:text-slate-400
                      hover:bg-slate-100
                      dark:hover:bg-slate-800
                      transition-colors
                    "
                  >
                    Tampilkan lebih sedikit
                  </button>
                ) : null}
              </>
            )}
          </section>
        </div>
      )}

      {/* =========================
          FOOTER
      ========================== */}

      {user?.role !== 'admin' && (
        <div
          className={`
            shrink-0
            border-t
            border-slate-200
            dark:border-slate-800
            p-3
            ${
              isCollapsed
                ? 'flex justify-center'
                : ''
            }
          `}
        >
          {isCollapsed ? (
            <div className="relative group">
              <button
                type="button"
                onClick={onLogout}
                className="
                  w-10
                  h-10
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-slate-500
                  dark:text-slate-400
                  hover:bg-red-50
                  dark:hover:bg-red-500/10
                  hover:text-red-600
                  dark:hover:text-red-400
                  transition-colors
                "
              >
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                </svg>
              </button>

              <Tooltip text="Keluar" />
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div
                className="
                  w-9
                  h-9
                  rounded-full
                  bg-slate-100
                  dark:bg-slate-800
                  flex
                  items-center
                  justify-center
                  text-sm
                  font-semibold
                  text-slate-600
                  dark:text-slate-300
                  shrink-0
                "
              >
                {(user?.name ||
                  user?.full_name ||
                  user?.email ||
                  'U')
                  .charAt(0)
                  .toUpperCase()}
              </div>

              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-200 truncate">
                  {user?.name ||
                    user?.full_name ||
                    'User'}
                </p>

                <p className="text-[11px] text-slate-400 dark:text-slate-500 truncate">
                  {user?.email || ''}
                </p>
              </div>

              <button
                type="button"
                onClick={onLogout}
                className="
                  w-8
                  h-8
                  rounded-lg
                  flex
                  items-center
                  justify-center
                  text-slate-400
                  dark:text-slate-500
                  hover:bg-red-50
                  dark:hover:bg-red-500/10
                  hover:text-red-600
                  dark:hover:text-red-400
                  transition-colors
                  shrink-0
                "
                title="Keluar"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M10 17l5-5-5-5" />
                  <path d="M15 12H3" />
                  <path d="M21 19V5a2 2 0 0 0-2-2h-6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};

export default Sidebar;