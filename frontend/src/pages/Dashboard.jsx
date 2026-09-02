import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';
import api from '../api/axios';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // State Data
  const [documents, setDocuments] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [messages, setMessages] = useState([]);

  // State UI & Loading
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [activeSession, setActiveSession] = useState(null); // Menyimpan objek session aktif
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  // ---------------------------------------------------------------------------
  // 1. Fetch Daftar Dokumen dari Backend
  // ---------------------------------------------------------------------------
  const fetchDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      const response = await api.get('/documents');
      // Anggap backend mengembalikan array dokumen atau paginated response
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setDocuments(data);
    } catch (err) {
      console.error('Gagal mengambil daftar dokumen:', err);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // 2. Fetch Daftar Sesi Chat User dari Backend
  // ---------------------------------------------------------------------------
  const fetchChatSessions = useCallback(async () => {
    try {
      const response = await api.get('/chat/sessions');
      const sessions = response.data || [];
      setChatSessions(sessions);

      // Jika belum ada sesi aktif yang dipilih, pilih sesi pertama atau default
      if (sessions.length > 0 && !activeSession) {
        setActiveSession(sessions[0]);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar sesi chat:', err);
    }
  }, [activeSession]);

  // Load awal saat komponen dimuat
  useEffect(() => {
    fetchDocuments();
    fetchChatSessions();
  }, [fetchDocuments, fetchChatSessions]);

  // ---------------------------------------------------------------------------
  // 3. Fetch Pesan ketika Active Session Berganti
  // ---------------------------------------------------------------------------
  const fetchMessagesForSession = useCallback(async (sessionId) => {
    if (!sessionId) return;
    setLoadingMessages(true);
    try {
      const response = await api.get(`/chat/sessions/${sessionId}/messages`);
      setMessages(response.data || []);
    } catch (err) {
      console.error('Gagal mengambil pesan chat:', err);
      setMessages([]);
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  useEffect(() => {
    if (activeSession?.id) {
      fetchMessagesForSession(activeSession.id);
    } else {
      setMessages([]);
    }
  }, [activeSession, fetchMessagesForSession]);

  // ---------------------------------------------------------------------------
  // 4. Buat Sesi Chat Baru (Global / Terkait Dokumen Spesifik)
  // ---------------------------------------------------------------------------
  const handleCreateSession = async (documentId = null, customTitle = null) => {
    try {
      // Cari nama dokumen jika documentId ada
      let title = customTitle || 'Global Knowledge Base';
      if (documentId) {
        const targetDoc = documents.find((doc) => doc.id === documentId);
        if (targetDoc) {
          title = `Chat: ${targetDoc.title || targetDoc.filename}`;
        }
      }

      const response = await api.post('/chat/sessions', {
        title: title,
        document_id: documentId,
      });

      const newSession = response.data;
      setChatSessions((prev) => [newSession, ...prev]);
      setActiveSession(newSession);
      return newSession;
    } catch (err) {
      console.error('Gagal membuat sesi chat baru:', err);
    }
  };

  // ---------------------------------------------------------------------------
  // 5. Kirim Pesan User & Terima Respons RAG Backend
  // ---------------------------------------------------------------------------
  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    let currentSession = activeSession;

    // Jika belum ada sesi yang aktif, buat sesi global baru otomatis
    if (!currentSession) {
      currentSession = await handleCreateSession(null, 'Global Chat');
      if (!currentSession) return;
    }

    // Optimistic UI Update: Tampilkan pesan user langsung di layar
    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSendingMessage(true);
    console.log('TYPING INDICATOR: TRUE');

    try {
      const response = await api.post(`/chat/sessions/${currentSession.id}/messages`, {
        content: text,
      });

      // Response berisi objek pesan dari backend (termasuk respons bot & metadata RAG)
      // Jika backend mengembalikan pasangan pesan atau pesan assistant saja:
      if (Array.isArray(response.data)) {
        setMessages(response.data);
      } else {
        // Jika backend mengembalikan pesan bot yang baru saja dibuat
        const assistantMsg = response.data;
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id), // ganti temp dengan data asli jika perlu
          tempUserMsg,
          assistantMsg,
        ]);
      }

      // Refresh daftar sesi untuk memperbarui urutan `updated_at`
      fetchChatSessions();
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
      // Opsi: Tampilkan notifikasi error ke user
    } finally {
      setSendingMessage(false);
      console.log('TYPING INDICATOR: FALSE');
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased">
      {/* Panel Kiri: Sidebar */}
      <Sidebar
        documents={documents}
        loadingDocuments={loadingDocuments}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        chatSessions={chatSessions}
        activeSession={activeSession}
        setActiveSession={setActiveSession}
        onCreateSession={handleCreateSession}
        onLogout={logout}
        user={user}
      />

      {/* Panel Kanan: Interface Chat AI */}
      <ChatArea
        activeSession={activeSession}
        messages={messages}
        loading={sendingMessage}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default Dashboard;