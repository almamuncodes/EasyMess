"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { Camera, Image as ImageIcon, RefreshCw, AlertCircle, Sparkles } from "lucide-react";

export default function QRScannerComponent({ onScan, isProcessing }) {
  const [activeTab, setActiveTab] = useState("camera"); // "camera" | "file"
  const [cameraError, setCameraError] = useState("");
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [fileError, setFileError] = useState("");
  const scannerRef = useRef(null);
  const readerDivId = "reader-camera-container";
  const fileInputRef = useRef(null);

  // Extract invite code from decoded QR string or URL
  const extractCode = useCallback((decodedText) => {
    if (!decodedText) return "";
    const cleanText = decodedText.trim();
    try {
      if (cleanText.includes("http://") || cleanText.includes("https://")) {
        const url = new URL(cleanText);
        const codeParam = url.searchParams.get("code");
        if (codeParam) return codeParam.trim();
      }
    } catch (e) {
      // Not a valid URL, fallback to direct text processing
    }

    if (cleanText.includes("code=")) {
      const parts = cleanText.split("code=");
      if (parts[1]) {
        return parts[1].split("&")[0].trim();
      }
    }

    return cleanText;
  }, []);

  const lastScannedTimeRef = useRef(0);
  const lastScannedCodeRef = useRef("");

  const handleSuccessfulScan = useCallback(
    (decodedText) => {
      if (isProcessing) return;
      const code = extractCode(decodedText);
      const now = Date.now();

      if (code) {
        if (lastScannedCodeRef.current === code && now - lastScannedTimeRef.current < 4000) {
          return; // Prevent repeating scan for same code within 4s window
        }
        lastScannedCodeRef.current = code;
        lastScannedTimeRef.current = now;
        onScan(code);
      }
    },
    [extractCode, onScan, isProcessing]
  );

  // Start Camera Scanning
  const startCamera = useCallback(async () => {
    try {
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch (e) {
          // ignore error if already stopped
        }
      }

      const html5Qrcode = new Html5Qrcode(readerDivId);
      scannerRef.current = html5Qrcode;

      const config = {
        fps: 10,
        qrbox: { width: 220, height: 220 },
        aspectRatio: 1.0,
      };

      await html5Qrcode.start(
        { facingMode: "environment" },
        config,
        (decodedText) => {
          // Success callback
          handleSuccessfulScan(decodedText);
        },
        () => {
          // Scan failure (ignore framing errors)
        }
      );
      setCameraError("");
    } catch (err) {
      console.error("Camera start error:", err);
      setCameraError(
        "Could not access camera. Please allow camera permissions or upload a QR image instead."
      );
    } finally {
      setIsStartingCamera(false);
    }
  }, [handleSuccessfulScan]);

  const stopCamera = useCallback(async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (e) {
        // ignore stop errors
      }
      scannerRef.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    if (activeTab === "camera") {
      setIsStartingCamera(true);
      setCameraError("");
      Promise.resolve().then(() => {
        if (mounted) startCamera();
      });
    } else {
      stopCamera();
    }

    return () => {
      mounted = false;
      stopCamera();
    };
  }, [activeTab, startCamera, stopCamera]);

  // Handle Image File Upload Scanning
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileError("");
    try {
      const html5Qrcode = new Html5Qrcode("reader-file-container");
      const decodedText = await html5Qrcode.scanFile(file, true);
      html5Qrcode.clear();
      handleSuccessfulScan(decodedText);
    } catch (err) {
      console.error("File scan error:", err);
      setFileError("No readable QR code found in this image. Please try another clear photo.");
    }
  };

  return (
    <div className="w-full max-w-sm mx-auto">
      {/* Mode Selector Tabs */}
      <div className="flex bg-gray-100 dark:bg-slate-800 p-1 rounded-xl mb-4">
        <button
          type="button"
          onClick={() => setActiveTab("camera")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === "camera"
              ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-700"
          }`}
        >
          <Camera size={15} />
          Scan Camera
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("file")}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition cursor-pointer ${
            activeTab === "file"
              ? "bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-sm"
              : "text-gray-500 dark:text-slate-400 hover:text-gray-700"
          }`}
        >
          <ImageIcon size={15} />
          Upload Image
        </button>
      </div>

      {/* Camera View */}
      {activeTab === "camera" && (
        <div className="relative flex flex-col items-center justify-center bg-slate-900 rounded-2xl overflow-hidden min-h-[280px] shadow-lg border border-gray-800">
          <div id={readerDivId} className="w-full h-full overflow-hidden" />

          {isStartingCamera && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 text-white gap-2">
              <RefreshCw size={24} className="animate-spin text-orange-500" />
              <span className="text-xs text-gray-300">Starting camera...</span>
            </div>
          )}

          {cameraError && (
            <div className="absolute inset-0 p-6 flex flex-col items-center justify-center bg-slate-900 text-center text-white gap-3">
              <AlertCircle size={32} className="text-red-400" />
              <p className="text-xs text-gray-300 leading-relaxed">{cameraError}</p>
              <button
                type="button"
                onClick={startCamera}
                className="mt-1 px-4 py-2 bg-orange-600 text-white rounded-xl text-xs font-semibold hover:bg-orange-700 transition cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {isProcessing && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm text-white gap-2 z-20">
              <Sparkles size={28} className="animate-bounce text-orange-400" />
              <span className="text-sm font-semibold text-orange-300">
                Scanning & Joining...
              </span>
            </div>
          )}
        </div>
      )}

      {/* File Upload View */}
      {activeTab === "file" && (
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-gray-300 dark:border-slate-700 rounded-2xl bg-gray-50 dark:bg-slate-900 text-center">
          <div id="reader-file-container" className="hidden" />
          <ImageIcon size={40} className="text-orange-500 mb-2 opacity-80" />
          <h4 className="text-sm font-semibold text-gray-800 dark:text-slate-200">
            Select QR Image
          </h4>
          <p className="text-xs text-gray-500 dark:text-slate-400 mt-1 mb-4">
            Upload a screenshot or photo of a Mess QR code.
          </p>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleFileUpload}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isProcessing}
            className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-medium text-xs rounded-xl shadow transition cursor-pointer disabled:opacity-50"
          >
            {isProcessing ? "Processing..." : "Browse Photo"}
          </button>

          {fileError && (
            <p className="text-xs text-red-500 mt-3 font-medium flex items-center gap-1 justify-center">
              <AlertCircle size={14} />
              {fileError}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
