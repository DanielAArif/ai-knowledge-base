// src/pages/admin/AdminChatbot.jsx

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../AuthContext';
import Sidebar from '../../components/Sidebar'; // Sidebar dokumen/chat history internal
import ChatArea from '../../components/ChatArea';
import api from '../../api/axios';

const AdminChatbot = () => {
  const { user, logout } = useAuth();

  const [documents, setDocuments] = useState([]);
  const [chatSessions, setChatSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [searchDocQuery, setSearchDocQuery] = useState('');
  const [activeSession, setActiveSession] = useState(null);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sendingMessage, setSendingMessage] = useState(false);

  const fetchDocuments = useCallback(async () => {
    setLoadingDocuments(true);
    try {
      const response = await api.get('/documents');
      const data = Array.isArray(response.data) ? response.data : response.data.items || [];
      setDocuments(data);
    } catch (err) {
      console.error('Gagal mengambil daftar dokumen:', err);
    } finally {
      setLoadingDocuments(false);
    }
  }, []);

  const fetchChatSessions = useCallback(async () => {
    try {
      const response = await api.get('/chat/sessions');
      const sessions = response.data || [];
      setChatSessions(sessions);
      if (sessions.length > 0 && !activeSession) {
        setActiveSession(sessions[0]);
      }
    } catch (err) {
      console.error('Gagal mengambil daftar sesi chat:', err);
    }
  }, [activeSession]);

  useEffect(() => {
    fetchDocuments();
    fetchChatSessions();
  }, [fetchDocuments, fetchChatSessions]);

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

  const handleCreateSession = async (documentId = null, customTitle = null) => {
    try {
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

  const handleSendMessage = async (text) => {
    if (!text.trim()) return;

    let currentSession = activeSession;
    if (!currentSession) {
      currentSession = await handleCreateSession(null, 'Global Chat');
      if (!currentSession) return;
    }

    const tempUserMsg = {
      id: Date.now(),
      role: 'user',
      content: text,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setSendingMessage(true);

    try {
      const response = await api.post(`/chat/sessions/${currentSession.id}/messages`, { content: text });

      if (Array.isArray(response.data)) {
        setMessages(response.data);
      } else {
        const assistantMsg = response.data;
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          tempUserMsg,
          assistantMsg,
        ]);
      }
      fetchChatSessions();
    } catch (err) {
      console.error('Gagal mengirim pesan:', err);
    } finally {
      setSendingMessage(false);
    }
  };

  return (
    <div className="flex h-full min-h-0 w-full min-w-0 overflow-hidden bg-slate-100 dark:bg-neutral-900">
      {/* Sidebar Dokumen & Chat History */}
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

      {/* Area Chat Utama */}
      <ChatArea
        activeSession={activeSession}
        messages={messages}
        loadingMessages={loadingMessages}
        sendingMessage={sendingMessage}
        onSendMessage={handleSendMessage}
      />
    </div>
  );
};

export default AdminChatbot;