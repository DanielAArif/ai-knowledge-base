import { useEffect, useRef } from 'react';

const useDocumentWebSocket = (
  documents = [],
  onMessage
) => {
  const socketsRef = useRef({});
  const onMessageRef = useRef(onMessage);

  /*
   * =========================================================
   * SIMPAN CALLBACK TERBARU
   * =========================================================
   */
  useEffect(() => {
    onMessageRef.current = onMessage;
  }, [onMessage]);

  /*
   * =========================================================
   * WEBSOCKET CONNECTION MANAGER
   * =========================================================
   */
  useEffect(() => {
    if (!Array.isArray(documents)) {
      return;
    }

    /*
     * =======================================================
     * WEBSOCKET BASE URL
     * =======================================================
     *
     * Frontend :
     * localhost:3001
     *
     * Backend :
     * localhost:8000
     *
     * Browser harus terhubung langsung ke backend.
     */
    const wsBaseUrl =
      'ws://localhost:8000';

    console.log(
      '[WebSocket] Base URL:',
      wsBaseUrl
    );

    /*
     * =======================================================
     * DOKUMEN AKTIF
     * =======================================================
     *
     * Hanya dokumen yang masih diproses
     * yang membutuhkan WebSocket.
     */
    const activeDocumentIds =
      new Set();

    documents.forEach((document) => {
      if (
        document?.id === undefined ||
        document?.id === null
      ) {
        return;
      }

      const documentId =
        String(document.id);

      const status = String(
        document.status || ''
      )
        .toLowerCase()
        .trim();

      const isTerminal =
        status === 'completed' ||
        status === 'complete' ||
        status === 'processed' ||
        status === 'failed';

      if (!isTerminal) {
        activeDocumentIds.add(
          documentId
        );
      }
    });

    /*
     * =======================================================
     * TUTUP SOCKET YANG SUDAH TIDAK AKTIF
     * =======================================================
     */
    Object.entries(
      socketsRef.current
    ).forEach(
      ([documentId, ws]) => {
        if (
          !activeDocumentIds.has(
            documentId
          )
        ) {
          console.log(
            `[WebSocket] Closing inactive socket: ${documentId}`
          );

          if (
            ws.readyState ===
              WebSocket.OPEN ||
            ws.readyState ===
              WebSocket.CONNECTING
          ) {
            ws.close(
              1000,
              'Document no longer active'
            );
          }

          /*
           * Hanya hapus jika socket
           * masih merupakan socket yang tersimpan.
           */
          if (
            socketsRef.current[
              documentId
            ] === ws
          ) {
            delete socketsRef.current[
              documentId
            ];
          }
        }
      }
    );

    /*
     * =======================================================
     * BUAT WEBSOCKET UNTUK SETIAP DOKUMEN
     * =======================================================
     */
    documents.forEach((document) => {
      if (
        document?.id === undefined ||
        document?.id === null
      ) {
        return;
      }

      const documentId =
        String(document.id);

      const status = String(
        document.status || ''
      )
        .toLowerCase()
        .trim();

      /*
       * Dokumen yang sudah selesai
       * tidak membutuhkan socket.
       */
      const isTerminal =
        status === 'completed' ||
        status === 'complete' ||
        status === 'processed' ||
        status === 'failed';

      if (isTerminal) {
        return;
      }

      /*
       * =====================================================
       * CEK SOCKET YANG SUDAH ADA
       * =====================================================
       */
      const existingSocket =
        socketsRef.current[
          documentId
        ];

      if (existingSocket) {
        /*
         * Socket masih aktif.
         * Jangan membuat koneksi kedua.
         */
        if (
          existingSocket.readyState ===
            WebSocket.OPEN ||
          existingSocket.readyState ===
            WebSocket.CONNECTING
        ) {
          return;
        }

        /*
         * Socket sudah CLOSED/CLOSING.
         */
        delete socketsRef.current[
          documentId
        ];
      }

      /*
       * =====================================================
       * URL WEBSOCKET
       * =====================================================
       */
      const wsUrl =
        `${wsBaseUrl}/documents/ws/${documentId}`;

      console.log(
        `[WebSocket] Connecting document ${documentId}:`,
        wsUrl
      );

      let ws;

      try {
        ws =
          new WebSocket(wsUrl);
      } catch (error) {
        console.error(
          `[WebSocket] Failed to create socket for document ${documentId}:`,
          error
        );

        return;
      }

      /*
       * Simpan socket.
       */
      socketsRef.current[
        documentId
      ] = ws;

      /*
       * =====================================================
       * ON OPEN
       * =====================================================
       */
      ws.onopen = () => {
        console.log(
          `[WebSocket] CONNECTED document ${documentId}`
        );
      };

      /*
       * =====================================================
       * ON MESSAGE
       * =====================================================
       */
      ws.onmessage = (event) => {
        console.log(
          `[WebSocket] RAW MESSAGE document ${documentId}:`,
          event.data
        );

        let data;

        /*
         * ===================================================
         * PARSE JSON
         * ===================================================
         */
        try {
          data =
            JSON.parse(
              event.data
            );
        } catch (error) {
          console.error(
            `[WebSocket] Invalid JSON document ${documentId}:`,
            event.data,
            error
          );

          return;
        }

        console.log(
          `[WebSocket] PARSED MESSAGE document ${documentId}:`,
          data
        );

        /*
         * ===================================================
         * VALIDASI EVENT
         * ===================================================
         */
        if (
          data?.type !==
          'document_indexing'
        ) {
          console.log(
            `[WebSocket] Ignored event document ${documentId}:`,
            data?.type
          );

          return;
        }

        /*
         * ===================================================
         * KIRIM EVENT KE DOCUMENT MANAGEMENT
         * ===================================================
         */
        if (
          typeof onMessageRef.current ===
          'function'
        ) {
          console.log(
            `[WebSocket] Sending event to React component document ${documentId}:`,
            data
          );

          onMessageRef.current(
            data
          );
        } else {
          console.warn(
            `[WebSocket] onMessage callback tidak tersedia untuk document ${documentId}`
          );
        }

        /*
         * ===================================================
         * CEK STATUS
         * ===================================================
         */
        const messageStatus =
          String(
            data?.status || ''
          )
            .toLowerCase()
            .trim();

        /*
         * ===================================================
         * TERMINAL STATUS
         * ===================================================
         */
        const isTerminalStatus =
          messageStatus ===
            'completed' ||
          messageStatus ===
            'complete' ||
          messageStatus ===
            'processed' ||
          messageStatus ===
            'failed';

        if (isTerminalStatus) {
          console.log(
            `[WebSocket] Terminal status document ${documentId}: ${messageStatus}`
          );

          /*
           * Tunggu sebentar agar callback
           * React selesai diproses.
           */
          setTimeout(() => {
            if (
              ws.readyState ===
                WebSocket.OPEN ||
              ws.readyState ===
                WebSocket.CONNECTING
            ) {
              ws.close(
                1000,
                'Processing finished'
              );
            }
          }, 100);
        }
      };

      /*
       * =====================================================
       * ON ERROR
       * =====================================================
       */
      ws.onerror = (error) => {
        console.error(
          `[WebSocket] ERROR document ${documentId}:`,
          error
        );
      };

      /*
       * =====================================================
       * ON CLOSE
       * =====================================================
       */
      ws.onclose = (event) => {
        console.log(
          `[WebSocket] CLOSED document ${documentId}:`,
          {
            code:
              event.code,
            reason:
              event.reason,
            wasClean:
              event.wasClean,
          }
        );

        /*
         * Jangan menghapus socket baru
         * jika socket lama sudah digantikan.
         */
        if (
          socketsRef.current[
            documentId
          ] === ws
        ) {
          delete socketsRef.current[
            documentId
          ];
        }
      };
    });

    /*
     * Tidak ada cleanup di sini.
     *
     * Socket dikelola berdasarkan
     * socketsRef.current.
     */
  }, [documents]);

  /*
   * =========================================================
   * CLEANUP SAAT COMPONENT UNMOUNT
   * =========================================================
   */
  useEffect(() => {
    return () => {
      console.log(
        '[WebSocket] Component unmount - closing all sockets'
      );

      Object.entries(
        socketsRef.current
      ).forEach(
        ([documentId, ws]) => {
          console.log(
            `[WebSocket] Final cleanup document ${documentId}`
          );

          if (
            ws.readyState ===
              WebSocket.OPEN ||
            ws.readyState ===
              WebSocket.CONNECTING
          ) {
            ws.close(
              1000,
              'Component unmounted'
            );
          }
        }
      );

      socketsRef.current = {};
    };
  }, []);

  return socketsRef;
};

export default useDocumentWebSocket;