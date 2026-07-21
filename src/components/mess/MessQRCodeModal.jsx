"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { X, Copy, Check, Share2, QrCode } from "lucide-react";

export default function MessQRCodeModal({ isOpen, onClose, messInfo }) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

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

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xs sm:max-w-sm bg-white dark:bg-slate-900 rounded-2xl p-4 sm:p-5 shadow-2xl border border-gray-100 dark:border-slate-800 text-slate-800 dark:text-slate-100 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1.5 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-slate-200 hover:bg-gray-100 dark:hover:bg-slate-800 transition cursor-pointer"
        >
          <X size={18} />
        </button>

        {/* Header */}
        <div className="text-center mb-3 pr-6">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 text-[11px] font-semibold uppercase tracking-wider mb-1">
            <QrCode size={13} />
            Mess Join QR Code
          </div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
            {messName}
          </h2>
          {managerName && (
            <p className="text-xs text-gray-500 dark:text-slate-400 mt-0.5">
              Manager: {managerName}
            </p>
          )}
        </div>

        {/* QR Display Card */}
        <div className="flex flex-col items-center justify-center bg-gradient-to-b from-orange-50/50 to-amber-50/30 dark:from-slate-800/60 dark:to-slate-800/30 rounded-xl p-3.5 border border-orange-100/80 dark:border-slate-700/60 shadow-inner">
          <div className="relative p-2.5 bg-white rounded-xl shadow-md border border-gray-100">
            {/* Displaying SVG QR Code */}
            <QRCodeSVG
              value={joinUrl}
              size={145}
              level="H"
              includeMargin={true}
              imageSettings={
                messImage
                  ? {
                      src: messImage,
                      x: undefined,
                      y: undefined,
                      height: 30,
                      width: 30,
                      excavate: true,
                    }
                  : undefined
              }
            />
          </div>

          {/* Invite Code Stamp */}
          <div className="mt-2.5 text-center">
            <span className="text-[10px] uppercase tracking-widest font-semibold text-gray-400 dark:text-slate-400 block mb-0.5">
              Invite Code
            </span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-white dark:bg-slate-900 border border-gray-200 dark:border-slate-700 rounded-lg shadow-sm">
              <span className="font-mono text-base font-bold tracking-widest text-orange-600 dark:text-orange-400">
                {inviteCode}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        <p className="text-center text-[11px] text-gray-500 dark:text-slate-400 mt-2.5 leading-snug">
          Scan QR code or use code to join mess instantly.
        </p>

        {/* Actions Grid */}
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button
            onClick={handleCopyCode}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg font-medium text-xs transition cursor-pointer"
          >
            {copiedCode ? (
              <>
                <Check size={14} className="text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Copy size={14} />
                Copy Code
              </>
            )}
          </button>

          <button
            onClick={handleCopyLink}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-lg font-medium text-xs transition cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check size={14} className="text-green-500" />
                Copied
              </>
            ) : (
              <>
                <Share2 size={14} />
                Copy Link
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
