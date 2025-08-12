import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QrCodeIcon, CameraIcon, XMarkIcon, PaperAirplaneIcon } from '@heroicons/react/24/outline';
import { API_ENDPOINTS } from '../../config/api';
import { setAuthHeaders } from '../../utils/auth';
import { showError, showSuccess } from '../../utils/toast';

// We load Html5Qrcode at runtime to avoid SSR/import issues
let Html5QrcodeScannerClass = null;

const AttendanceTab = () => {
  const [showScanner, setShowScanner] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const scannerRef = useRef(null);
  const scannerId = 'student-attendance-qr-scanner';

  useEffect(() => {
    let scannerInstance = null;
    async function startScanner() {
      if (!showScanner) return;
      try {
        if (!Html5QrcodeScannerClass) {
          const mod = await import('html5-qrcode');
          Html5QrcodeScannerClass = mod.Html5QrcodeScanner;
        }

        scannerInstance = new Html5QrcodeScannerClass(
          scannerId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
            rememberLastUsedCamera: true,
          },
          false
        );

        scannerInstance.render(async (decodedText) => {
          await submitToken(decodedText);
        }, () => {});

        scannerRef.current = scannerInstance;
      } catch (e) {
        console.error(e);
        showError('Unable to start camera scanner');
      }
    }

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [showScanner]);

  const submitToken = async (tokenValue) => {
    if (!tokenValue) return;
    const cleaned = tokenValue.trim();
    try {
      setSubmitting(true);
      const res = await fetch(API_ENDPOINTS.SCHEDULE.STUDENT_CHECK, {
        method: 'POST',
        headers: setAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ token: cleaned })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.message || 'Failed to check in');
        return;
      }
      const data = await res.json();
      showSuccess(data?.message || 'Attendance marked successfully');
      setShowScanner(false);
      setManualToken('');
    } catch (e) {
      showError('Network error while submitting token');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white font-bold text-lg">Attendance</h3>
      </div>

      <div className="bg-white/5 border border-white/10 rounded-xl p-4 sm:p-6">
        <p className="text-gray-300 mb-4">Scan the session QR code provided by your teacher to mark your attendance.</p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => setShowScanner(true)}
            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-[#CA133E] text-white hover:bg-[#A01030]"
          >
            <CameraIcon className="h-5 w-5" />
            <span>Open Scanner</span>
          </button>
          <div className="flex-1 flex gap-2">
            <input
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Or paste token here"
              className="flex-1 px-3 py-2 rounded-xl bg-white/10 border border-white/10 text-white placeholder-gray-400"
            />
            <button
              disabled={!manualToken || submitting}
              onClick={() => submitToken(manualToken)}
              className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/15 text-white hover:bg-white/25 disabled:opacity-50"
            >
              <PaperAirplaneIcon className="h-5 w-5" />
              <span>Submit</span>
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showScanner && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="bg-[#2a1a1a] rounded-xl p-4 border border-white/20 w-full max-w-md">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-white font-bold">
                  <QrCodeIcon className="h-5 w-5" />
                  <span>Scan QR Code</span>
                </div>
                <button onClick={() => setShowScanner(false)} className="text-gray-300 hover:text-white">
                  <XMarkIcon className="h-6 w-6" />
                </button>
              </div>
              <div id={scannerId} className="bg-black rounded-xl overflow-hidden" />
              <p className="text-gray-300 text-xs mt-3">Align the QR code within the square. Camera permission is required.</p>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AttendanceTab;


