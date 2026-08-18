import React, { useState } from 'react';
import { useAuth } from '../AuthContext';
import Sidebar from '../components/Sidebar';
import ChatArea from '../components/ChatArea';

const Dashboard = () => {
  const { user, logout } = useAuth();

  // State untuk daftar dokumen RAG
  const [documents] = useState([
    { id: '1', title: 'SOP_Pengadaan_Barang_2026.pdf', size: '2.4 MB', fileUrl: '/files/sop.pdf' },
    { id: '2', title: 'Laporan_Keuangan_Q1_2026.pdf', size: '1.8 MB', fileUrl: '/files/laporan.pdf' },
    { id: '3', title: 'Panduan_Keamanan_IT.pdf', size: '3.1 MB', fileUrl: '/files/panduan_it.pdf' }
  ]);

  // State pencarian dokumen di sidebar
  const [searchDocQuery, setSearchDocQuery] = useState('');

  // State mode chat aktif (default: Chatbot Global)
  const [activeChat, setActiveChat] = useState({
    type: 'global',
    id: 'global',
    title: 'Global Knowledge Base'
  });

  // State riwayat obrolan yang terpisah untuk setiap target chat
  const [chatHistories, setChatHistories] = useState({
    global: [
      { sender: 'bot', text: 'Halo! Saya Chatbot Global. Anda bisa menanyakan informasi dari seluruh dokumen yang tersedia.', time: '10:00' }
    ]
  });

  const [loading, setLoading] = useState(false);

  // Fungsi saat user mengirim pesan baru
  const handleSendMessage = async (text) => {
    const chatKey = activeChat.id;
    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newUserMsg = { sender: 'user', text, time: now };

    // 1. Tambah pesan user ke state chat terkait
    setChatHistories((prev) => ({
      ...prev,
      [chatKey]: [...(prev[chatKey] || []), newUserMsg]
    }));

    setLoading(true);

    try {
      // TODO: Panggil API Backend RAG kamu di sini
      // const response = await api.post('/rag/chat', { prompt: text, target_doc_id: activeChat.id });

      // Simulasi delay respons dari LLM
      setTimeout(() => {
        const botResponse = {
          sender: 'bot',
          text: `Ini adalah jawaban AI berbasis RAG untuk pertanyaan: "${text}" pada konteks ${activeChat.title}.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        setChatHistories((prev) => ({
          ...prev,
          [chatKey]: [...(prev[chatKey] || []), botResponse]
        }));
        setLoading(false);
      }, 1200);
    } catch (err) {
      console.error('Error RAG Chat:', err);
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-100 font-sans antialiased">
      {/* Panel Kiri: Sidebar WhatsApp-Style */}
      <Sidebar
        documents={documents}
        searchDocQuery={searchDocQuery}
        setSearchDocQuery={setSearchDocQuery}
        activeChat={activeChat}
        setActiveChat={setActiveChat}
        onLogout={logout}
        user={user}
      />

      {/* Panel Kanan: Interface Chat AI */}
      <ChatArea
        activeChat={activeChat}
        messages={chatHistories[activeChat.id] || []}
        onSendMessage={handleSendMessage}
        loading={loading}
      />
    </div>
  );
};

export default Dashboard;