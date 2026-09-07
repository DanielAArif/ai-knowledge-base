import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  FileText,
  MessageSquare,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Upload,
  MoreHorizontal,
  CheckCircle2,
  Clock3,
  AlertCircle,
  File,
} from 'lucide-react';

const AdminDashboard = () => {
  const navigate = useNavigate();

  // =========================================================
  // DUMMY DATA
  // =========================================================

  const stats = [
    {
      title: 'Total Pengguna',
      value: '128',
      change: '+12.5%',
      trend: 'up',
      description: 'dibanding bulan lalu',
      icon: Users,
      iconBg: 'bg-blue-50 dark:bg-blue-500/10',
      iconColor: 'text-blue-600 dark:text-blue-400',
    },
    {
      title: 'Total Dokumen',
      value: '356',
      change: '+8.2%',
      trend: 'up',
      description: 'dibanding bulan lalu',
      icon: FileText,
      iconBg: 'bg-violet-50 dark:bg-violet-500/10',
      iconColor: 'text-violet-600 dark:text-violet-400',
    },
    {
      title: 'Sesi Chat',
      value: '1,284',
      change: '+18.7%',
      trend: 'up',
      description: 'dibanding bulan lalu',
      icon: MessageSquare,
      iconBg: 'bg-emerald-50 dark:bg-emerald-500/10',
      iconColor: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      title: 'Total Pesan',
      value: '6,742',
      change: '-2.4%',
      trend: 'down',
      description: 'dibanding bulan lalu',
      icon: Activity,
      iconBg: 'bg-amber-50 dark:bg-amber-500/10',
      iconColor: 'text-amber-600 dark:text-amber-400',
    },
  ];

  const recentDocuments = [
    {
      name: 'AI Knowledge Base Project Proposal.pdf',
      date: '05 Sep 2026',
      type: 'PDF',
      status: 'completed',
      uploadedBy: 'Muhammad Khadziq',
    },
    {
      name: 'Panduan Penggunaan Sistem.docx',
      date: '04 Sep 2026',
      type: 'DOCX',
      status: 'processing',
      uploadedBy: 'Admin',
    },
    {
      name: 'Dokumentasi API Backend.pdf',
      date: '03 Sep 2026',
      type: 'PDF',
      status: 'completed',
      uploadedBy: 'Ahmad Fauzan',
    },
    {
      name: 'Laporan Evaluasi Sistem 2026.pdf',
      date: '02 Sep 2026',
      type: 'PDF',
      status: 'completed',
      uploadedBy: 'Siti Rahma',
    },
    {
      name: 'Data Penelitian Informatika.xlsx',
      date: '01 Sep 2026',
      type: 'XLSX',
      status: 'pending',
      uploadedBy: 'Budi Santoso',
    },
  ];

  const monthlyUploads = [
    { month: 'Apr', value: 32 },
    { month: 'Mei', value: 48 },
    { month: 'Jun', value: 61 },
    { month: 'Jul', value: 74 },
    { month: 'Agu', value: 89 },
    { month: 'Sep', value: 52 },
  ];

  const topDocuments = [
    {
      name: 'Panduan Sistem Knowledge Base',
      count: 342,
    },
    {
      name: 'Dokumentasi API Backend',
      count: 286,
    },
    {
      name: 'AI Knowledge Base Project Proposal',
      count: 241,
    },
    {
      name: 'Laporan Evaluasi Sistem',
      count: 198,
    },
    {
      name: 'Panduan Penggunaan Chatbot',
      count: 154,
    },
  ];

  const maxUpload = Math.max(
    ...monthlyUploads.map((item) => item.value)
  );

  // =========================================================
  // HELPERS
  // =========================================================

  const getFileIcon = (type) => {
    return (
      <div className="
        flex h-9 w-9
        items-center justify-center
        rounded-lg
        bg-slate-100 dark:bg-slate-800
        text-slate-500 dark:text-slate-400
        flex-shrink-0
      ">
        <File size={16} />
      </div>
    );
  };

  const StatusBadge = ({ status }) => {

    const config = {
      completed: {
        label: 'Selesai',
        icon: CheckCircle2,
        className:
          'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/40',
      },
      processing: {
        label: 'Diproses',
        icon: Clock3,
        className:
          'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-100 dark:border-blue-900/40',
      },
      pending: {
        label: 'Menunggu',
        icon: AlertCircle,
        className:
          'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/40',
      },
    };

    const item = config[status] || config.pending;
    const Icon = item.icon;

    return (
      <span className={`
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border
        px-2.5
        py-1
        text-[10px]
        font-semibold
        ${item.className}
      `}>
        <Icon size={11} />
        {item.label}
      </span>
    );
  };

  return (
    <div className="min-h-full">

      {/* =====================================================
          HEADER
      ===================================================== */}
      <div className="mb-5">

        <div className="
          flex
          flex-col
          gap-4
          sm:flex-row
          sm:items-center
          sm:justify-between
        ">

          <div>

            <div className="
              flex
              items-center
              gap-2
              text-[11px]
              font-medium
              text-slate-400 dark:text-slate-500
              mb-1
            ">
              <span>Admin</span>
              <span>/</span>
              <span className="text-slate-500 dark:text-slate-400">
                Dashboard
              </span>
            </div>

            <h1 className="
              text-xl
              sm:text-2xl
              font-bold
              tracking-tight
              text-slate-900 dark:text-white
            ">
              Dashboard Overview
            </h1>

            <p className="
              text-xs
              sm:text-sm
              text-slate-500 dark:text-slate-400
              mt-1
            ">
              Pantau aktivitas dan performa knowledge base.
            </p>

          </div>

          <button
            onClick={() => navigate('/admin/documents')}
            className="
              inline-flex
              items-center
              justify-center
              gap-2
              rounded-xl
              bg-blue-600
              px-4
              py-2.5
              text-xs
              font-semibold
              text-white
              shadow-sm
              shadow-blue-200 dark:shadow-none
              transition-all
              hover:bg-blue-700
              active:scale-[0.98]
            "
          >
            <Upload size={15} />
            Kelola Dokumen
          </button>

        </div>

      </div>

      {/* =====================================================
          DEMO NOTICE
      ===================================================== */}
      <div className="
        mb-5
        rounded-xl
        border
        border-blue-100 dark:border-blue-900/40
        bg-blue-50 dark:bg-blue-500/5
        px-4
        py-3
      ">

        <div className="flex items-start gap-3">

          <div className="
            mt-0.5
            flex
            h-7
            w-7
            flex-shrink-0
            items-center
            justify-center
            rounded-lg
            bg-blue-100 dark:bg-blue-500/10
            text-blue-600 dark:text-blue-400
          ">
            <Activity size={14} />
          </div>

          <div>

            <p className="
              text-xs
              font-semibold
              text-blue-800 dark:text-blue-300
            ">
              Mode Demo
            </p>

            <p className="
              text-[11px]
              text-blue-600 dark:text-blue-400
              mt-0.5
            ">
              Data dashboard saat ini masih menggunakan data dummy.
            </p>

          </div>

        </div>

      </div>

      {/* =====================================================
          STAT CARDS
      ===================================================== */}
      <div className="
        grid
        grid-cols-1
        sm:grid-cols-2
        xl:grid-cols-4
        gap-4
      ">

        {stats.map((stat) => {

          const Icon = stat.icon;

          return (
            <div
              key={stat.title}
              className="
                rounded-2xl
                border
                border-slate-200 dark:border-slate-800
                bg-white dark:bg-neutral-950
                p-4
                shadow-sm
                shadow-slate-200/40 dark:shadow-none
                transition-colors duration-200
              "
            >

              <div className="flex items-start justify-between">

                <div className={`
                  flex
                  h-9
                  w-9
                  items-center
                  justify-center
                  rounded-xl
                  ${stat.iconBg}
                  ${stat.iconColor}
                `}>
                  <Icon size={17} />
                </div>

                <button className="
                  text-slate-300
                  dark:text-slate-600
                  hover:text-slate-500
                  dark:hover:text-slate-400
                ">
                  <MoreHorizontal size={17} />
                </button>

              </div>

              <div className="mt-4">

                <p className="
                  text-[11px]
                  font-medium
                  text-slate-500 dark:text-slate-400
                ">
                  {stat.title}
                </p>

                <div className="
                  flex
                  items-end
                  justify-between
                  gap-2
                  mt-1
                ">

                  <p className="
                    text-2xl
                    font-bold
                    tracking-tight
                    text-slate-900 dark:text-white
                  ">
                    {stat.value}
                  </p>

                  <span className={`
                    inline-flex
                    items-center
                    gap-0.5
                    text-[10px]
                    font-semibold
                    ${
                      stat.trend === 'up'
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-red-500 dark:text-red-400'
                    }
                  `}>
                    {stat.trend === 'up' ? (
                      <ArrowUpRight size={12} />
                    ) : (
                      <ArrowDownRight size={12} />
                    )}

                    {stat.change}
                  </span>

                </div>

                <p className="
                  text-[10px]
                  text-slate-400 dark:text-slate-500
                  mt-1
                ">
                  {stat.description}
                </p>

              </div>

            </div>
          );
        })}

      </div>

      {/* =====================================================
          MAIN GRID
      ===================================================== */}
      <div className="
        grid
        grid-cols-1
        xl:grid-cols-3
        gap-4
        mt-4
      ">

        {/* ===================================================
            MONTHLY UPLOADS
        =================================================== */}
        <div className="
          xl:col-span-2
          rounded-2xl
          border
          border-slate-200 dark:border-slate-800
          bg-white dark:bg-neutral-950
          shadow-sm
          shadow-slate-200/40 dark:shadow-none
          overflow-hidden
        ">

          <div className="
            flex
            items-center
            justify-between
            px-4
            py-4
            border-b
            border-slate-100 dark:border-slate-800
          ">

            <div>

              <h2 className="
                text-sm
                font-bold
                text-slate-900 dark:text-white
              ">
                Upload Dokumen
              </h2>

              <p className="
                text-[10px]
                text-slate-400 dark:text-slate-500
                mt-0.5
              ">
                Aktivitas upload 6 bulan terakhir
              </p>

            </div>

            <button className="
              text-slate-400
              dark:text-slate-500
              hover:text-slate-700
              dark:hover:text-slate-300
            ">
              <MoreHorizontal size={18} />
            </button>

          </div>

          <div className="p-4">

            <div className="
              flex
              items-end
              justify-between
              gap-3
              h-48
            ">

              {monthlyUploads.map((item) => {

                const height =
                  (item.value / maxUpload) * 100;

                return (
                  <div
                    key={item.month}
                    className="
                      flex-1
                      h-full
                      flex
                      flex-col
                      items-center
                      justify-end
                      gap-2
                    "
                  >

                    <span className="
                      text-[10px]
                      font-semibold
                      text-slate-500 dark:text-slate-400
                    ">
                      {item.value}
                    </span>

                    <div className="
                      w-full
                      max-w-10
                      flex-1
                      rounded-lg
                      bg-slate-100 dark:bg-slate-800
                      flex
                      items-end
                      overflow-hidden
                    ">

                      <div
                        className="
                          w-full
                          rounded-lg
                          bg-blue-600
                          transition-all
                        "
                        style={{
                          height: `${height}%`,
                        }}
                      />

                    </div>

                    <span className="
                      text-[10px]
                      font-medium
                      text-slate-400 dark:text-slate-500
                    ">
                      {item.month}
                    </span>

                  </div>
                );
              })}

            </div>

          </div>

        </div>

        {/* ===================================================
            TOP DOCUMENTS
        =================================================== */}
        <div className="
          rounded-2xl
          border
          border-slate-200 dark:border-slate-800
          bg-white dark:bg-neutral-950
          shadow-sm
          shadow-slate-200/40 dark:shadow-none
          overflow-hidden
        ">

          <div className="
            flex
            items-center
            justify-between
            px-4
            py-4
            border-b
            border-slate-100 dark:border-slate-800
          ">

            <div>

              <h2 className="
                text-sm
                font-bold
                text-slate-900 dark:text-white
              ">
                Dokumen Terpopuler
              </h2>

              <p className="
                text-[10px]
                text-slate-400 dark:text-slate-500
                mt-0.5
              ">
                Paling sering digunakan
              </p>

            </div>

          </div>

          <div className="p-4 space-y-4">

            {topDocuments.map((document, index) => (

              <div
                key={document.name}
                className="flex items-center gap-3"
              >

                <div className="
                  flex
                  h-7
                  w-7
                  flex-shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  bg-slate-100 dark:bg-slate-800
                  text-[10px]
                  font-bold
                  text-slate-500 dark:text-slate-400
                ">
                  {index + 1}
                </div>

                <div className="min-w-0 flex-1">

                  <div className="
                    flex
                    items-center
                    justify-between
                    gap-3
                  ">

                    <p className="
                      text-[11px]
                      font-medium
                      text-slate-700 dark:text-slate-200
                      truncate
                    ">
                      {document.name}
                    </p>

                    <span className="
                      flex-shrink-0
                      text-[10px]
                      font-semibold
                      text-slate-500 dark:text-slate-400
                    ">
                      {document.count}
                    </span>

                  </div>

                  <div className="
                    mt-1.5
                    h-1
                    rounded-full
                    bg-slate-100 dark:bg-slate-800
                    overflow-hidden
                  ">

                    <div
                      className="
                        h-full
                        rounded-full
                        bg-blue-500
                      "
                      style={{
                        width: `${Math.min(
                          (document.count / 342) * 100,
                          100
                        )}%`,
                      }}
                    />

                  </div>

                </div>

              </div>

            ))}

          </div>

        </div>

      </div>

      {/* =====================================================
          RECENT DOCUMENTS
      ===================================================== */}
      <div className="
        mt-4
        rounded-2xl
        border
        border-slate-200 dark:border-slate-800
        bg-white dark:bg-neutral-950
        shadow-sm
        shadow-slate-200/40 dark:shadow-none
        overflow-hidden
      ">

        <div className="
          flex
          items-center
          justify-between
          px-4
          py-4
          border-b
          border-slate-100 dark:border-slate-800
        ">

          <div>

            <h2 className="
              text-sm
              font-bold
              text-slate-900 dark:text-white
            ">
              Dokumen Terbaru
            </h2>

            <p className="
              text-[10px]
              text-slate-400 dark:text-slate-500
              mt-0.5
            ">
              Aktivitas dokumen terbaru
            </p>

          </div>

          <button
            onClick={() => navigate('/admin/documents')}
            className="
              text-[11px]
              font-semibold
              text-blue-600 dark:text-blue-400
              hover:text-blue-700 dark:hover:text-blue-300
            "
          >
            Lihat semua
          </button>

        </div>

        {/* TABLE */}
        <div className="overflow-x-auto">

          <table className="w-full min-w-[720px]">

            <thead>

              <tr className="
                border-b
                border-slate-100 dark:border-slate-800
                bg-slate-50/70 dark:bg-slate-800/30
              ">

                <th className="
                  px-4 py-3
                  text-left
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-400 dark:text-slate-500
                ">
                  Dokumen
                </th>

                <th className="
                  px-4 py-3
                  text-left
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-400 dark:text-slate-500
                ">
                  Pengunggah
                </th>

                <th className="
                  px-4 py-3
                  text-left
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-400 dark:text-slate-500
                ">
                  Tanggal
                </th>

                <th className="
                  px-4 py-3
                  text-left
                  text-[10px]
                  font-semibold
                  uppercase
                  tracking-wider
                  text-slate-400 dark:text-slate-500
                ">
                  Status
                </th>

              </tr>

            </thead>

            <tbody>

              {recentDocuments.map((document) => (

                <tr
                  key={document.name}
                  className="
                    border-b
                    last:border-b-0
                    border-slate-100 dark:border-slate-800
                    hover:bg-slate-50 dark:hover:bg-slate-800/40
                    transition-colors
                  "
                >

                  {/* DOCUMENT */}
                  <td className="px-4 py-3">

                    <div className="flex items-center gap-3">

                      {getFileIcon(document.type)}

                      <div className="min-w-0">

                        <p className="
                          text-xs
                          font-semibold
                          text-slate-700 dark:text-slate-200
                          truncate
                          max-w-[280px]
                        ">
                          {document.name}
                        </p>

                        <p className="
                          text-[10px]
                          text-slate-400 dark:text-slate-500
                          mt-0.5
                        ">
                          {document.type}
                        </p>

                      </div>

                    </div>

                  </td>

                  {/* USER */}
                  <td className="
                    px-4 py-3
                    text-[11px]
                    font-medium
                    text-slate-600 dark:text-slate-400
                  ">
                    {document.uploadedBy}
                  </td>

                  {/* DATE */}
                  <td className="
                    px-4 py-3
                    text-[11px]
                    text-slate-500 dark:text-slate-400
                  ">
                    {document.date}
                  </td>

                  {/* STATUS */}
                  <td className="px-4 py-3">
                    <StatusBadge
                      status={document.status}
                    />
                  </td>

                </tr>

              ))}

            </tbody>

          </table>

        </div>

      </div>

      {/* =====================================================
          FOOTER
      ===================================================== */}
      <div className="
        flex
        items-center
        justify-between
        py-5
        text-[10px]
        text-slate-400 dark:text-slate-600
      ">

        <span>
          AI Knowledge Base Dashboard
        </span>

        <span>
          Demo Mode
        </span>

      </div>

    </div>
  );
};

export default AdminDashboard;