import React, {
  useState,
  useEffect,
  useCallback,
} from 'react';

import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import api from '../api/axios';
import useDocumentWebSocket from '../hooks/UseDocumentWebSocket';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // ============================================================
  // STATE DATA
  // ============================================================

  const [documents, setDocuments] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [messages, setMessages] = useState([]);

  // ============================================================
  // STATE UI & LOADING
  // ============================================================

  const [searchDocQuery, setSearchDocQuery] =
    useState('');

  const [activeSession, setActiveSession] =
    useState(null);

  const [loadingDocuments, setLoadingDocuments] =
    useState(false);

  const [loadingMessages, setLoadingMessages] =
    useState(false);

  const [sendingMessage, setSendingMessage] =
    useState(false);

  // ============================================================
  // 1. FETCH DAFTAR DOKUMEN
  // ============================================================

  const fetchDocuments = useCallback(
    async () => {
      setLoadingDocuments(true);

      try {
        const response =
          await api.get('/documents');

        const data = Array.isArray(
          response.data
        )
          ? response.data
          : response.data?.items || [];

        setDocuments(data);

        return data;
      } catch (err) {
        console.error(
          'Gagal mengambil daftar dokumen:',
          err
        );

        return [];
      } finally {
        setLoadingDocuments(false);
      }
    },
    []
  );

  // ============================================================
  // 2. FETCH DAFTAR SESI CHAT
  // ============================================================

  const fetchChatSessions = useCallback(
    async () => {
      try {
        const response =
          await api.get('/chat/sessions');

        const sessions =
          Array.isArray(response.data)
            ? response.data
            : response.data?.items || [];

        console.log(
          '[ChatSession] Daftar session:',
          sessions
        );

        setChatSessions(sessions);

        /*
         * Hanya tentukan active session jika
         * memang belum ada active session.
         *
         * Jangan mengganti active session setiap
         * kali daftar chat di-refresh.
         */
        setActiveSession(
          (currentActiveSession) => {
            if (currentActiveSession) {
              const updatedSession =
                sessions.find(
                  (session) =>
                    String(session.id) ===
                    String(
                      currentActiveSession.id
                    )
                );

              return (
                updatedSession ||
                currentActiveSession
              );
            }

            return sessions.length > 0
              ? sessions[0]
              : null;
          }
        );

        return sessions;
      } catch (err) {
        console.error(
          'Gagal mengambil daftar sesi chat:',
          err
        );

        return [];
      }
    },
    []
  );

  // ============================================================
  // 3. CARI SESSION DOKUMEN
  // ============================================================

  const waitForDocumentChatSession =
    useCallback(
      async (documentId) => {
        /*
         * Backend membuat ChatSession setelah
         * indexing selesai.
         *
         * Jadi kita polling endpoint:
         *
         * GET /chat/sessions
         *
         * sampai session untuk document_id
         * benar-benar tersedia.
         */

        const maxAttempts = 20;
        const delay = 500;

        for (
          let attempt = 1;
          attempt <= maxAttempts;
          attempt++
        ) {
          try {
            console.log(
              `[ChatSession] Mencari session dokumen ${documentId} (${attempt}/${maxAttempts})`
            );

            const response =
              await api.get(
                '/chat/sessions'
              );

            const sessions =
              Array.isArray(
                response.data
              )
                ? response.data
                : response.data?.items ||
                  [];

            /*
             * Cari session berdasarkan
             * document_id.
             */
            const documentSession =
              sessions.find(
                (session) =>
                  String(
                    session.document_id
                  ) ===
                  String(
                    documentId
                  )
              );

            /*
             * SESSION SUDAH TERSEDIA
             */
            if (documentSession) {
              console.log(
                '[ChatSession] Session dokumen ditemukan:',
                documentSession
              );

              /*
               * Langsung update state chatSessions.
               *
               * Ini bagian penting agar Sidebar
               * langsung melakukan re-render tanpa
               * refresh browser.
               */
              setChatSessions(
                (previousSessions) => {
                  const exists =
                    previousSessions.some(
                      (session) =>
                        String(
                          session.id
                        ) ===
                        String(
                          documentSession.id
                        )
                    );

                  if (exists) {
                    return previousSessions.map(
                      (session) =>
                        String(
                          session.id
                        ) ===
                        String(
                          documentSession.id
                        )
                          ? documentSession
                          : session
                    );
                  }

                  return [
                    documentSession,
                    ...previousSessions,
                  ];
                }
              );

              return documentSession;
            }

            /*
             * Session belum tersedia.
             * Tunggu sebelum request berikutnya.
             */
            if (
              attempt < maxAttempts
            ) {
              await new Promise(
                (resolve) =>
                  setTimeout(
                    resolve,
                    delay
                  )
              );
            }
          } catch (err) {
            console.error(
              `[ChatSession] Gagal mengecek session dokumen ${documentId}:`,
              err
            );

            if (
              attempt < maxAttempts
            ) {
              await new Promise(
                (resolve) =>
                  setTimeout(
                    resolve,
                    delay
                  )
              );
            }
          }
        }

        console.warn(
          `[ChatSession] Session dokumen ${documentId} tidak ditemukan setelah polling.`
        );

        return null;
      },
      []
    );

  // ============================================================
  // 4. HANDLE WEBSOCKET MESSAGE
  // ============================================================

  const handleDocumentWebSocketMessage =
    useCallback(
      async (data) => {
        const documentId =
          data.document_id;

        const status = String(
          data.status || ''
        )
          .toLowerCase()
          .trim();

        console.log(
          `[WebSocket] Document ${documentId} status: ${status}`
        );

        // --------------------------------------------------------
        // UPDATE STATUS DOCUMENT
        // --------------------------------------------------------

        setDocuments(
          (previousDocuments) =>
            previousDocuments.map(
              (document) =>
                String(
                  document.id
                ) ===
                String(
                  documentId
                )
                  ? {
                      ...document,
                      status:
                        status,
                    }
                  : document
            )
        );

        // --------------------------------------------------------
        // INDEXING COMPLETED
        // --------------------------------------------------------

        if (
          status === 'completed'
        ) {
          console.log(
            `[WebSocket] Document ${documentId} selesai indexing.`
          );

          /*
           * 1. Sinkronkan dokumen.
           */
          await fetchDocuments();

          /*
           * 2. Tunggu sampai ChatSession
           * document-specific benar-benar
           * tersedia di backend.
           */
          const documentSession =
            await waitForDocumentChatSession(
              documentId
            );

          if (documentSession) {
            console.log(
              `[ChatSession] Chat khusus dokumen ${documentId} berhasil ditambahkan ke Sidebar.`
            );
          }

          return;
        }

        // --------------------------------------------------------
        // INDEXING FAILED
        // --------------------------------------------------------

        if (
          status === 'failed'
        ) {
          console.error(
            `[WebSocket] Indexing document ${documentId} gagal.`,
            data.message
          );

          await fetchDocuments();
          await fetchChatSessions();
        }
      },
      [
        fetchDocuments,
        fetchChatSessions,
        waitForDocumentChatSession,
      ]
    );

  // ============================================================
  // 5. AKTIFKAN WEBSOCKET MONITORING
  // ============================================================

  useDocumentWebSocket(
    documents,
    handleDocumentWebSocketMessage
  );

  // ============================================================
  // 6. LOAD DATA AWAL
  // ============================================================

  useEffect(() => {
    const loadInitialData =
      async () => {
        await Promise.all([
          fetchDocuments(),
          fetchChatSessions(),
        ]);
      };

    loadInitialData();
  }, [
    fetchDocuments,
    fetchChatSessions,
  ]);

  // ============================================================
  // 7. FETCH PESAN SESSION
  // ============================================================

  const fetchMessagesForSession =
    useCallback(
      async (sessionId) => {
        if (!sessionId) {
          return;
        }

        setLoadingMessages(true);

        try {
          const response =
            await api.get(
              `/chat/sessions/${sessionId}/messages`
            );

          setMessages(
            response.data || []
          );
        } catch (err) {
          console.error(
            'Gagal mengambil pesan chat:',
            err
          );

          setMessages([]);
        } finally {
          setLoadingMessages(false);
        }
      },
      []
    );

  // ============================================================
  // 8. LOAD MESSAGE SAAT ACTIVE SESSION BERUBAH
  // ============================================================

  useEffect(() => {
    if (
      activeSession?.id
    ) {
      fetchMessagesForSession(
        activeSession.id
      );
    } else {
      setMessages([]);
    }
  }, [
    activeSession,
    fetchMessagesForSession,
  ]);

  // ============================================================
  // 9. BUAT SESI CHAT BARU
  // ============================================================

  const handleCreateSession =
    async (
      documentId = null,
      customTitle = null
    ) => {
      try {
        let title =
          customTitle ||
          'Global Knowledge Base';

        // --------------------------------------------------------
        // DOCUMENT-SPECIFIC CHAT
        // --------------------------------------------------------

        if (documentId) {
          const targetDoc =
            documents.find(
              (doc) =>
                String(
                  doc.id
                ) ===
                String(
                  documentId
                )
            );

          if (targetDoc) {
            title =
              `Chat: ${
                targetDoc.title ||
                targetDoc.filename
              }`;
          }
        }

        // --------------------------------------------------------
        // REQUEST BACKEND
        // --------------------------------------------------------

        const response =
          await api.post(
            '/chat/sessions',
            {
              title,
              document_id:
                documentId,
            }
          );

        const newSession =
          response.data;

        // --------------------------------------------------------
        // UPDATE STATE
        // --------------------------------------------------------

        setChatSessions(
          (previousSessions) => {
            const exists =
              previousSessions.some(
                (session) =>
                  String(
                    session.id
                  ) ===
                  String(
                    newSession.id
                  )
              );

            if (exists) {
              return previousSessions.map(
                (session) =>
                  String(
                    session.id
                  ) ===
                  String(
                    newSession.id
                  )
                    ? newSession
                    : session
              );
            }

            return [
              newSession,
              ...previousSessions,
            ];
          }
        );

        setActiveSession(
          newSession
        );

        return newSession;
      } catch (err) {
        console.error(
          'Gagal membuat sesi chat baru:',
          err
        );

        return null;
      }
    };

  // ============================================================
  // 10. KIRIM PESAN USER & TERIMA RESPONS RAG
  // ============================================================

  const handleSendMessage =
    async (text) => {
      if (!text.trim()) {
        return;
      }

      let currentSession =
        activeSession;

      // ----------------------------------------------------------
      // Jika belum ada session,
      // buat Global Chat
      // ----------------------------------------------------------

      if (!currentSession) {
        currentSession =
          await handleCreateSession(
            null,
            'Global Chat'
          );

        if (!currentSession) {
          return;
        }
      }

      // ----------------------------------------------------------
      // TEMPORARY USER MESSAGE
      // ----------------------------------------------------------

      const tempUserMsg = {
        id: Date.now(),
        role: 'user',
        content: text,
        created_at:
          new Date().toISOString(),
      };

      setMessages(
        (previousMessages) => [
          ...previousMessages,
          tempUserMsg,
        ]
      );

      setSendingMessage(true);

      console.log(
        'TYPING INDICATOR: TRUE'
      );

      // ----------------------------------------------------------
      // REQUEST RAG
      // ----------------------------------------------------------

      try {
        const response =
          await api.post(
            `/chat/sessions/${currentSession.id}/messages`,
            {
              content: text,
            }
          );

        // --------------------------------------------------------
        // RESPONSE ARRAY
        // --------------------------------------------------------

        if (
          Array.isArray(
            response.data
          )
        ) {
          setMessages(
            response.data
          );
        }

        // --------------------------------------------------------
        // RESPONSE ASSISTANT MESSAGE
        // --------------------------------------------------------

        else {
          const assistantMsg =
            response.data;

          setMessages(
            (previousMessages) => [
              ...previousMessages.filter(
                (message) =>
                  message.id !==
                  tempUserMsg.id
              ),
              tempUserMsg,
              assistantMsg,
            ]
          );
        }

        /*
         * Sinkronisasi daftar session.
         */
        await fetchChatSessions();
      } catch (err) {
        console.error(
          'Gagal mengirim pesan:',
          err
        );
      } finally {
        setSendingMessage(false);

        console.log(
          'TYPING INDICATOR: FALSE'
        );
      }
    };

  // ============================================================
  // RENDER
  // ============================================================

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased">

      {/* ======================================================
          PANEL KIRI
          ====================================================== */}

      <Sidebar
        documents={documents}
        loadingDocuments={
          loadingDocuments
        }
        searchDocQuery={
          searchDocQuery
        }
        setSearchDocQuery={
          setSearchDocQuery
        }
        chatSessions={
          chatSessions
        }
        activeSession={
          activeSession
        }
        setActiveSession={
          setActiveSession
        }
        onCreateSession={
          handleCreateSession
        }
        onLogout={
          logout
        }
        user={user}
      />

      {/* ======================================================
          PANEL KANAN
          ====================================================== */}

      <ChatArea
        activeSession={
          activeSession
        }
        messages={
          messages
        }
        loading={
          sendingMessage
        }
        onSendMessage={
          handleSendMessage
        }
      />
    </div>
  );
};

export default Dashboard;