"use client";

import { useState, useRef } from "react";
import { QRCodeSVG, QRCodeCanvas } from "qrcode.react";
import { X, Copy, Check, Download, Share2, QrCode } from "lucide-react";

export default function MessQRCodeModal({ isOpen, onClose, messInfo }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const canvasRef = useRef(null);

  if (!isOpen || !messInfo) return null;

  const inviteCode = messInfo.inviteCode || messInfo.code || "";
  const messName = messInfo.messName || messInfo.name || "EasyMess";
  const messImage = messInfo.messImage || messInfo.image || null;
  const managerName = messInfo.managerName || "";

  const origin =
    typeof window !== "undefined"
      ? window.location.origin
      : "https://easymess.vercel.app";
  const joinUrl = `${origin}/join-mess?code=${inviteCode}`;

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(inviteCode);
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    } catch (e) {
      console.error("Copy failed", e);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (e) {
      console.error("Copy link failed", e);
    }
  };

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current.querySelector("canvas");
    if (!canvas) return;

    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = `${messName.replace(/\s+/g, "_")}_QR_Code.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 shadow-2xl border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-xs font-semibold uppercase tracking-wider mb-2">
            <QrCode size={14} />
            Mess Join QR Code
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {messName}
          </h2>
          {managerName && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Manager: {managerName}
            </p>
          )}
        </div>

        {/* QR Display Card */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-orange-50/50 to-amber-50/30 dark:from-slate-800/60 dark:to-slate-800/30 rounded-2xl p-6 border border-orange-100/80 dark:border-slate-700/60 shadow-inner">
          <div className="relative p-4 bg-white rounded-2xl shadow-md border border-gray-100">
            {/* Displaying SVG QR Code */}
            <QRCodeSVG
              value={joinUrl}
              size={190}
              level="H"
              includeMargin={true}
              imageSettings={
                messImage
                  ? {
                      src: messImage,
                      x: undefined,
                      y: undefined,
                      height: 38,
                      width: 38,
                      excavate: true,
                    }
                  : undefined
              }
            />

            {/* Hidden Canvas QR Code for downloading PNG */}
            <div ref={canvasRef} className="hidden">
              <QRCodeCanvas
                value={joinUrl}
                size={512}
                level="H"
                includeMargin={true}
                imageSettings={
                  messImage
                    ? {
                        src: messImage,
                        x: undefined,
                        y: undefined,
                        height: 96,
                        width: 96,
                        excavate: true,
                      }
                    : undefined
                }
              />
            </div>
          </div>

          {/* Invite Code Stamp */}
          <div className="mt-4 text-center">
            <span className="text-xs uppercase tracking-widest font-medium text-gray-400 dark:text-slate-400 block mb-1">
              Invite Code
            </span>
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-xl shadow-sm">
              <span className="font-mono text-lg font-bold tracking-widest text-orange-600 dark:text-orange-400">
                {inviteCode}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-center text-xs text-gray-500 dark:text-slate-400 mt-4 leading-relaxed">
          Scan this QR code using camera or EasyMess QR Scanner to send an instant join request.
        </p>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={handleCopyCode}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check size={16} className="text-green-500" />
                Copied Code
              </>
            ) : (
              <>
                <Copy size={16} />
                Copy Code
              </>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-2 py-2.5 px-3 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl font-medium text-xs sm:text-sm transition cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check size={16} className="text-green-500" />
                Copied Link
              </>
            ) : (
              <>
                <Share2 size={16} />
                Copy Link
              </>
            )}
          </button>
        </div>

        {/* Download Button */}
        <button
          onClick={handleDownload}
          className="w-full mt-3 flex items-center justify-center gap-2 py-3 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl font-semibold text-sm shadow-md hover:shadow-lg transition cursor-pointer"
        >
          <Download size={18} />
          Download QR Image
        </button>
      </div>
    </div>
  );
}
