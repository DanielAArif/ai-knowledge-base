import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useOutletContext } from 'react-router-dom';
import api from '../../api/axios';
import useDocumentWebSocket from '../../hooks/UseDocumentWebSocket';

import {
  Search,
  FileText,
  FolderOpen,
  Upload,
  RefreshCw,
  Pencil,
  Trash2,
  X,
  CheckCircle2,
  Clock3,
  AlertCircle,
} from 'lucide-react';

const DOCUMENTS_PER_PAGE = 10;

const DocumentManagement = () => {
  const { onUploadingChange } =
    useOutletContext() || {};

  const [documents, setDocuments] = useState([]);
  const [categories, setCategories] = useState([]);

  const [file, setFile] = useState(null);
  const [categoryId, setCategoryId] = useState('');

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] =
    useState(false);
  const [error, setError] = useState('');

  const [search, setSearch] =
    useState('');
  const [currentPage, setCurrentPage] =
    useState(1);

  // ==================== EDIT MODAL ====================

  const [selectedDoc, setSelectedDoc] =
    useState(null);
  const [editTitle, setEditTitle] =
    useState('');
  const [editCategoryId, setEditCategoryId] =
    useState('');
  const [updating, setUpdating] =
    useState(false);

  // ==================== UPLOAD STATUS ====================

  useEffect(() => {
    if (onUploadingChange) {
      onUploadingChange(uploading);
    }

    const handleBeforeUnload = (e) => {
      if (uploading) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload
    );

    return () =>
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload
      );
  }, [
    uploading,
    onUploadingChange,
  ]);

  // ==================== FETCH DATA ====================

  const fetchData = useCallback(
    async () => {
      try {
        setError('');
        setLoading(true);

        const [
          docsRes,
          catRes,
        ] = await Promise.all([
          api.get('/documents'),
          api.get('/categories'),
        ]);

        const docsData =
          Array.isArray(docsRes.data)
            ? docsRes.data
            : docsRes.data.items ||
              docsRes.data.data ||
              [];

        const catsData =
          Array.isArray(catRes.data)
            ? catRes.data
            : catRes.data.items ||
              catRes.data.data ||
              [];

        setDocuments(docsData);
        setCategories(catsData);
      } catch (err) {
        console.error(
          'Gagal mengambil data dokumen:',
          err
        );

        setError(
          'Gagal memuat daftar dokumen.'
        );
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ==================== DOCUMENT WEBSOCKET ====================

  // ==================== DOCUMENT WEBSOCKET ====================

const handleDocumentWebSocketMessage = useCallback(
  (data) => {
    const documentId = data?.document_id;

    const status = String(
      data?.status || ''
    )
      .toLowerCase()
      .trim();

    if (
      documentId === undefined ||
      documentId === null ||
      !status
    ) {
      console.warn(
        '[DocumentManagement] Invalid WebSocket data:',
        data
      );

      return;
    }

    console.log(
      '[DocumentManagement] WebSocket status received:',
      {
        documentId,
        status,
        data,
      }
    );

    /*
     * Update state secara langsung dari WebSocket.
     *
     * JANGAN memanggil fetchData() di sini.
     * Jika langsung GET setelah menerima event,
     * response GET berpotensi masih berisi status lama
     * dan menimpa status realtime yang baru diterima.
     */
    setDocuments((prevDocuments) => {
      const documentExists = prevDocuments.some(
        (document) =>
          String(document.id) ===
          String(documentId)
      );

      if (!documentExists) {
        console.warn(
          `[DocumentManagement] Document ${documentId} tidak ditemukan di state`
        );

        return prevDocuments;
      }

      return prevDocuments.map((document) => {
        if (
          String(document.id) !==
          String(documentId)
        ) {
          return document;
        }

        console.log(
          `[DocumentManagement] Document ${documentId}: ${document.status} -> ${status}`
        );

        return {
          ...document,
          status,
        };
      });
    });
  },
  []
);

useDocumentWebSocket(
  documents,
  handleDocumentWebSocketMessage
);

  // ==================== UPLOAD ====================

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!file || !categoryId) {
      alert(
        'Pilih file dan kategori terlebih dahulu!'
      );

      return;
    }

    const formData = new FormData();

    formData.append(
      'file',
      file
    );

    formData.append(
      'category_id',
      categoryId
    );

    setUploading(true);

    try {
      await api.post(
        '/documents/upload',
        formData,
        {
          headers: {
            'Content-Type':
              'multipart/form-data',
          },
        }
      );

      setFile(null);
      setCategoryId('');

      /*
       * Ambil data terbaru setelah upload.
       *
       * Dokumen yang baru diupload biasanya
       * masih berstatus pending/processing.
       *
       * Setelah itu perubahan status akan
       * diterima melalui WebSocket.
       */
      await fetchData();

      alert(
        'Dokumen berhasil diunggah dan diproses ke Vector Store!'
      );
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          'Gagal mengunggah dokumen.'
      );
    } finally {
      setUploading(false);
    }
  };

  // ==================== DELETE ====================

  const handleDelete = async (id) => {
    if (
      !confirm(
        'Apakah Anda yakin ingin menghapus dokumen ini?'
      )
    ) {
      return;
    }

    try {
      await api.delete(
        `/documents/${id}`
      );

      await fetchData();
    } catch (err) {
      alert(
        'Gagal menghapus dokumen.'
      );
    }
  };

  // ==================== EDIT ====================

  const handleOpenEditModal = (
    doc
  ) => {
    setSelectedDoc(doc);

    setEditTitle(
      doc.title ||
        doc.filename ||
        doc.file_name ||
        ''
    );

    setEditCategoryId(
      doc.category_id ||
        doc.categoryId ||
        doc.category?.id ||
        ''
    );
  };

  const handleCloseEditModal = () => {
    if (updating) return;

    setSelectedDoc(null);
    setEditTitle('');
    setEditCategoryId('');
  };

  const handleSaveEdit = async (
    e
  ) => {
    e.preventDefault();

    if (!selectedDoc) return;

    setUpdating(true);

    try {
      await api.put(
        `/documents/${selectedDoc.id}`,
        {
          title:
            editTitle.trim(),
          category_id:
            Number(
              editCategoryId
            ),
        }
      );

      setSelectedDoc(null);
      setEditTitle('');
      setEditCategoryId('');

      await fetchData();
    } catch (err) {
      alert(
        err.response?.data?.detail ||
          'Gagal memperbarui dokumen.'
      );
    } finally {
      setUpdating(false);
    }
  };

  // ==================== HELPERS ====================

  const getDocumentName = (
    doc
  ) => {
    return (
      doc.filename ||
      doc.file_name ||
      doc.title ||
      doc.name ||
      'Dokumen Tanpa Nama'
    );
  };

  const getCategoryName = (
    doc
  ) => {
    if (doc.category_name) {
      return doc.category_name;
    }

    if (
      doc.category &&
      typeof doc.category ===
        'object'
    ) {
      return (
        doc.category.name ||
        doc.category.title ||
        '-'
      );
    }

    if (
      typeof doc.category ===
      'string'
    ) {
      return doc.category;
    }

    const targetCat =
      categories.find(
        (c) =>
          String(c.id) ===
          String(
            doc.category_id ||
              doc.categoryId
          )
      );

    return targetCat
      ? targetCat.name
      : '-';
  };

  const getDocumentStatus = (
    doc
  ) => {
    return (
      doc.status ||
      'completed'
    );
  };

  const getStatusConfig = (
    status
  ) => {
    const normalized =
      String(status)
        .toLowerCase()
        .trim();

    // =========================
    // COMPLETED
    // =========================

    if (
      normalized ===
        'completed' ||
      normalized ===
        'processed' ||
      normalized ===
        'complete'
    ) {
      return {
        label: 'Completed',
        icon: CheckCircle2,
        className:
          'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-900/50',
      };
    }

    // =========================
    // PROCESSING
    // =========================

    if (
      normalized ===
        'processing' ||
      normalized ===
        'preprocessing' ||
      normalized ===
        'embedding' ||
      normalized ===
        'storing' ||
      normalized ===
        'pending'
    ) {
      let label =
        'Processing';

      if (
        normalized ===
        'preprocessing'
      ) {
        label =
          'Preprocessing';
      } else if (
        normalized ===
        'embedding'
      ) {
        label =
          'Embedding';
      } else if (
        normalized ===
        'storing'
      ) {
        label =
          'Storing';
      } else if (
        normalized ===
        'pending'
      ) {
        label =
          'Pending';
      }

      return {
        label,
        icon: Clock3,
        className:
          'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-900/50',
      };
    }

    // =========================
    // FAILED
    // =========================

    if (
      normalized ===
        'failed' ||
      normalized.includes(
        'fail'
      ) ||
      normalized.includes(
        'error'
      )
    ) {
      return {
        label: 'Failed',
        icon: AlertCircle,
        className:
          'bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-900/50',
      };
    }

    // =========================
    // UNKNOWN
    // =========================

    return {
      label:
        status || 'Unknown',
      icon: Clock3,
      className:
        'bg-slate-100 text-slate-700 border-slate-200 dark:bg-neutral-800 dark:text-neutral-300 dark:border-neutral-700',
    };
  };

  // ==================== SEARCH ====================

  const filteredDocuments =
    useMemo(() => {
      const keyword =
        search
          .toLowerCase()
          .trim();

      if (!keyword) {
        return documents;
      }

      return documents.filter(
        (doc) => {
          const name =
            getDocumentName(
              doc
            ).toLowerCase();

          const category =
            getCategoryName(
              doc
            ).toLowerCase();

          const status =
            getDocumentStatus(
              doc
            ).toLowerCase();

          return (
            name.includes(
              keyword
            ) ||
            category.includes(
              keyword
            ) ||
            status.includes(
              keyword
            )
          );
        }
      );
    }, [
      documents,
      categories,
      search,
    ]);

  // ==================== PAGINATION ====================

  const totalPages =
    Math.ceil(
      filteredDocuments.length /
        DOCUMENTS_PER_PAGE
    );

  const paginatedDocuments =
    filteredDocuments.slice(
      (currentPage - 1) *
        DOCUMENTS_PER_PAGE,
      currentPage *
        DOCUMENTS_PER_PAGE
    );

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  // ==================== STATISTICS ====================

  const processedCount =
    documents.filter(
      (doc) => {
        const status =
          getDocumentStatus(
            doc
          ).toLowerCase();

        return (
          status ===
            'completed' ||
          status ===
            'processed' ||
          status ===
            'complete'
        );
      }
    ).length;

  const processingCount =
    documents.filter(
      (doc) => {
        const status =
          getDocumentStatus(
            doc
          ).toLowerCase();

        return [
          'processing',
          'preprocessing',
          'embedding',
          'storing',
          'pending',
        ].includes(status);
      }
    ).length;

  const failedCount =
    documents.filter(
      (doc) => {
        const status =
          getDocumentStatus(
            doc
          ).toLowerCase();

        return (
          status ===
            'failed' ||
          status.includes(
            'fail'
          ) ||
          status.includes(
            'error'
          )
        );
      }
    ).length;

  // ==================== RENDER ====================

  return (
    <div className="space-y-6">

      {/* ==================== HEADER ==================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

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
              Manajemen Dokumen
            </span>
          </div>

          <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
            Manajemen Dokumen
          </h1>

          <p className="mt-1 text-sm text-slate-500 dark:text-neutral-400">
            Kelola dokumen yang digunakan sebagai sumber pengetahuan sistem RAG.
          </p>

        </div>

        <button
          onClick={fetchData}
          disabled={
            loading ||
            uploading
          }
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-200 dark:hover:bg-neutral-800"
        >
          <RefreshCw
            size={16}
            className={
              loading
                ? 'animate-spin'
                : ''
            }
          />

          Refresh
        </button>

      </div>

      {/* ==================== ERROR ==================== */}

      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      {/* ==================== STATISTICS ==================== */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">

        {/* Total */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                Total Dokumen
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {documents.length}
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
              <FileText size={19} />
            </div>

          </div>

        </div>

        {/* Processed */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                RAG Processed
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {processedCount}
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
              <CheckCircle2 size={19} />
            </div>

          </div>

        </div>

        {/* Processing */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                Processing
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {processingCount}
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400">
              <Clock3 size={19} />
            </div>

          </div>

        </div>

        {/* Failed */}

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

          <div className="flex items-start justify-between">

            <div>

              <p className="text-sm font-medium text-slate-500 dark:text-neutral-400">
                Gagal Diproses
              </p>

              <p className="mt-2 text-2xl font-bold tracking-tight text-slate-900 dark:text-neutral-100">
                {failedCount}
              </p>

            </div>

            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400">
              <AlertCircle size={19} />
            </div>

          </div>

        </div>

      </div>

      {/* ==================== UPLOAD CARD ==================== */}

      <form
        onSubmit={handleUpload}
        className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900"
      >

        <div className="border-b border-slate-200 px-6 py-4 dark:border-neutral-800">

          <div className="flex items-center gap-2">

            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
              <Upload size={17} />
            </div>

            <div>

              <h2 className="font-semibold text-slate-900 dark:text-neutral-100">
                Upload Dokumen
              </h2>

              <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-500">
                Tambahkan dokumen baru ke knowledge base.
              </p>

            </div>

          </div>

        </div>

        <div className="p-6">

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

            {/* File */}

            <div>

              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-neutral-300">
                Pilih File
              </label>

              <input
                type="file"
                disabled={uploading}
                onChange={(e) =>
                  setFile(
                    e.target.files?.[0] ||
                      null
                  )
                }
                required
                accept=".pdf,.txt,.docx"
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-xs text-slate-500 outline-none transition file:mr-3 file:rounded-md file:border-0 file:bg-slate-200 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-slate-700 hover:file:bg-slate-300 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-400 dark:file:bg-neutral-800 dark:file:text-neutral-300 dark:hover:file:bg-neutral-700"
              />

              <p className="mt-1.5 text-xs text-slate-400 dark:text-neutral-600">
                Format yang didukung: PDF, TXT, DOCX
              </p>

            </div>

            {/* Category */}

            <div>

              <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-neutral-300">
                Kategori Dokumen
              </label>

              <select
                value={categoryId}
                disabled={uploading}
                onChange={(e) =>
                  setCategoryId(
                    e.target.value
                  )
                }
                required
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 disabled:cursor-not-allowed disabled:opacity-60 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
              >
                <option
                  value=""
                  className="bg-white text-slate-900 dark:bg-neutral-950 dark:text-neutral-100"
                >
                  Pilih Kategori
                </option>

                {categories.map(
                  (category) => (
                    <option
                      key={
                        category.id
                      }
                      value={
                        category.id
                      }
                      className="bg-white text-slate-900 dark:bg-neutral-950 dark:text-neutral-100"
                    >
                      {category.name ||
                        category.title}
                    </option>
                  )
                )}

              </select>

            </div>

          </div>

          <div className="mt-4 flex justify-end">

            <button
              type="submit"
              disabled={uploading}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {uploading ? (
                <>
                  <RefreshCw
                    size={16}
                    className="animate-spin"
                  />

                  Mengunggah & Processing...
                </>
              ) : (
                <>
                  <Upload size={16} />

                  Upload Dokumen
                </>
              )}

            </button>

          </div>

        </div>

      </form>

      {/* ==================== MAIN TABLE ==================== */}

      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-neutral-800 dark:bg-neutral-900">

        {/* Toolbar */}

        <div className="flex flex-col gap-4 border-b border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">

          <div>

            <h2 className="font-semibold text-slate-900 dark:text-neutral-100">
              Daftar Dokumen
            </h2>

            <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-500">
              {filteredDocuments.length} dokumen ditampilkan
            </p>

          </div>

          <div className="relative w-full sm:w-72">

            <Search
              size={17}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-neutral-500"
            />

            <input
              type="text"
              placeholder="Cari dokumen..."
              value={search}
              onChange={(e) =>
                setSearch(
                  e.target.value
                )
              }
              className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:placeholder:text-neutral-600 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
            />

          </div>

        </div>

        {/* Table */}

        <div className="overflow-x-auto">

          <table className="w-full table-fixed text-left">

            <thead>

              <tr className="border-b border-slate-200 bg-slate-50/70 dark:border-neutral-800 dark:bg-neutral-950/60">

                <th className="w-[50%] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                  Dokumen
                </th>

                <th className="w-[15%] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                  Kategori
                </th>

                <th className="w-[15%] px-6 py-3.5 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                  Status RAG
                </th>

                <th className="w-[20%] px-6 py-3.5 text-right text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-neutral-500">
                  Aksi
                </th>

              </tr>

            </thead>

            <tbody className="divide-y divide-slate-100 dark:divide-neutral-800">

              {loading ? (

                <tr>

                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <RefreshCw
                        size={22}
                        className="animate-spin text-slate-400 dark:text-neutral-500"
                      />

                      <p className="mt-3 text-sm text-slate-500 dark:text-neutral-400">
                        Memuat data dokumen...
                      </p>

                    </div>

                  </td>

                </tr>

              ) : filteredDocuments.length === 0 ? (

                <tr>

                  <td
                    colSpan="4"
                    className="px-6 py-12 text-center"
                  >

                    <div className="flex flex-col items-center justify-center">

                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 dark:bg-neutral-800">

                        <FileText
                          size={21}
                          className="text-slate-400 dark:text-neutral-500"
                        />

                      </div>

                      <p className="mt-3 text-sm font-medium text-slate-700 dark:text-neutral-300">
                        {search
                          ? 'Dokumen tidak ditemukan'
                          : 'Belum ada dokumen'}
                      </p>

                      <p className="mt-1 text-xs text-slate-500 dark:text-neutral-500">
                        {search
                          ? 'Coba gunakan kata kunci lain.'
                          : 'Dokumen yang diunggah akan muncul di sini.'}
                      </p>

                    </div>

                  </td>

                </tr>

              ) : (

                paginatedDocuments.map(
                  (doc) => {

                    const status =
                      getStatusConfig(
                        getDocumentStatus(
                          doc
                        )
                      );

                    const StatusIcon =
                      status.icon;

                    return (
                      <tr
                        key={
                          doc.id
                        }
                        className="group transition-colors hover:bg-slate-50/70 dark:hover:bg-neutral-800/40"
                      >

                        {/* Document */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-600 dark:bg-neutral-800 dark:text-neutral-300">
                              <FileText
                                size={17}
                              />
                            </div>

                            <div className="min-w-0">

                              <p className="max-w-md truncate text-sm font-semibold text-slate-800 dark:text-neutral-100">
                                {getDocumentName(
                                  doc
                                )}
                              </p>

                              <p className="text-xs text-slate-500 dark:text-neutral-500">
                                ID #
                                {
                                  doc.id
                                }
                              </p>

                            </div>

                          </div>

                        </td>

                        {/* Category */}

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <FolderOpen
                              size={15}
                              className="shrink-0 text-slate-400 dark:text-neutral-600"
                            />

                            <span className="text-sm font-medium text-slate-700 dark:text-neutral-300">
                              {getCategoryName(
                                doc
                              )}
                            </span>

                          </div>

                        </td>

                        {/* Status */}

                        <td className="px-6 py-4">

                          <span
                            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${status.className}`}
                          >

                            <StatusIcon
                              size={
                                13
                              }
                            />

                            {
                              status.label
                            }

                          </span>

                        </td>

                        {/* Actions */}

                        <td className="px-6 py-4">

                          <div className="flex items-center justify-end gap-2">

                            <button
                              type="button"
                              onClick={() =>
                                handleOpenEditModal(
                                  doc
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-50 hover:text-slate-900 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800 dark:hover:text-neutral-100"
                            >

                              <Pencil
                                size={
                                  13
                                }
                              />

                              Edit

                            </button>

                            <button
                              type="button"
                              onClick={() =>
                                handleDelete(
                                  doc.id
                                )
                              }
                              className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-medium text-red-600 transition hover:bg-red-50 dark:border-red-900/50 dark:bg-neutral-900 dark:text-red-400 dark:hover:bg-red-950/30"
                            >

                              <Trash2
                                size={
                                  13
                                }
                              />

                              Hapus

                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  }
                )

              )}

            </tbody>

          </table>

        </div>

        {/* ==================== PAGINATION ==================== */}

        {!loading &&
          filteredDocuments.length >
            0 && (

            <div className="flex flex-col gap-3 border-t border-slate-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-neutral-800">

              <p className="text-xs text-slate-500 dark:text-neutral-500">

                Menampilkan{' '}

                <span className="font-medium text-slate-700 dark:text-neutral-300">
                  {(currentPage -
                    1) *
                    DOCUMENTS_PER_PAGE +
                    1}
                </span>

                {' - '}

                <span className="font-medium text-slate-700 dark:text-neutral-300">
                  {Math.min(
                    currentPage *
                      DOCUMENTS_PER_PAGE,
                    filteredDocuments.length
                  )}
                </span>

                {' dari '}

                <span className="font-medium text-slate-700 dark:text-neutral-300">
                  {
                    filteredDocuments.length
                  }
                </span>

                {' dokumen'}

              </p>

              {totalPages >
                1 && (

                <div className="flex items-center gap-1">

                  <button
                    onClick={() =>
                      setCurrentPage(
                        (
                          prev
                        ) =>
                          Math.max(
                            prev - 1,
                            1
                          )
                      )
                    }
                    disabled={
                      currentPage ===
                      1
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    aria-label="Halaman sebelumnya"
                  >
                    ‹
                  </button>

                  {Array.from(
                    {
                      length:
                        totalPages,
                    },
                    (
                      _,
                      index
                    ) =>
                      index +
                      1
                  ).map(
                    (
                      page
                    ) => (

                      <button
                        key={
                          page
                        }
                        onClick={() =>
                          setCurrentPage(
                            page
                          )
                        }
                        className={`flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-xs font-medium transition ${
                          currentPage ===
                          page
                            ? 'bg-slate-900 text-white dark:bg-white dark:text-black'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-neutral-400 dark:hover:bg-neutral-800'
                        }`}
                      >
                        {
                          page
                        }
                      </button>

                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage(
                        (
                          prev
                        ) =>
                          Math.min(
                            prev + 1,
                            totalPages
                          )
                      )
                    }
                    disabled={
                      currentPage ===
                      totalPages
                    }
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-300 dark:hover:bg-neutral-800"
                    aria-label="Halaman berikutnya"
                  >
                    ›
                  </button>

                </div>

              )}

            </div>

          )}

      </div>

      {/* ==================== EDIT MODAL ==================== */}

      {selectedDoc && (

        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4 backdrop-blur-sm"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              handleCloseEditModal();
            }
          }}
        >

          <div className="w-full max-w-md overflow-hidden rounded-xl bg-white shadow-xl dark:bg-neutral-900">

            <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50/70 px-5 py-4 dark:border-neutral-800 dark:bg-neutral-950/60">

              <div>

                <h3 className="font-semibold text-slate-900 dark:text-neutral-100">
                  Edit Data Dokumen
                </h3>

                <p className="mt-0.5 text-xs text-slate-500 dark:text-neutral-500">
                  Perbarui informasi dokumen.
                </p>

              </div>

              <button
                type="button"
                onClick={
                  handleCloseEditModal
                }
                disabled={
                  updating
                }
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-500 dark:hover:bg-neutral-800 dark:hover:text-neutral-300"
                aria-label="Tutup modal"
              >
                <X size={18} />
              </button>

            </div>

            <form
              onSubmit={
                handleSaveEdit
              }
              className="space-y-4 p-6"
            >

              <div>

                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-neutral-300">
                  Judul / Nama Dokumen
                </label>

                <input
                  type="text"
                  value={
                    editTitle
                  }
                  onChange={(e) =>
                    setEditTitle(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
                />

              </div>

              <div>

                <label className="mb-1.5 block text-xs font-medium text-slate-700 dark:text-neutral-300">
                  Kategori Dokumen
                </label>

                <select
                  value={
                    editCategoryId
                  }
                  onChange={(e) =>
                    setEditCategoryId(
                      e.target.value
                    )
                  }
                  required
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-500/10 dark:border-neutral-800 dark:bg-neutral-950 dark:text-neutral-100 dark:focus:border-blue-500 dark:focus:bg-neutral-950"
                >

                  <option
                    value=""
                    className="bg-white text-slate-900 dark:bg-neutral-950 dark:text-neutral-100"
                  >
                    Pilih Kategori
                  </option>

                  {categories.map(
                    (
                      category
                    ) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                        className="bg-white text-slate-900 dark:bg-neutral-950 dark:text-neutral-100"
                      >
                        {
                          category.name ||
                          category.title
                        }
                      </option>
                    )
                  )}

                </select>

              </div>

              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4 dark:border-neutral-800">

                <button
                  type="button"
                  onClick={
                    handleCloseEditModal
                  }
                  disabled={
                    updating
                  }
                  className="rounded-lg px-4 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50 dark:text-neutral-300 dark:hover:bg-neutral-800"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={
                    updating
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                >

                  {updating ? (
                    <>
                      <RefreshCw
                        size={
                          14
                        }
                        className="animate-spin"
                      />
                      Menyimpan...
                    </>
                  ) : (
                    <>
                      <Pencil
                        size={
                          14
                        }
                      />
                      Simpan Perubahan
                    </>
                  )}

                </button>

              </div>

            </form>

          </div>

        </div>

      )}

    </div>
  );
};

export default DocumentManagement;
