"use client";
import { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Camera,
  MapPin,
  Users,
  Calendar,
  Crown,
  UserMinus,
  RefreshCw,
  Check,
  Pencil,
  ChevronRight,
  AlertTriangle,
  Loader2,
  QrCode,
} from "lucide-react";
import { GetUser } from "@/components/action/action";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import ImageCropModal from "@/components/ui/ImageCropModal";
import MessQRCodeModal from "@/components/mess/MessQRCodeModal";



const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function MyMess() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const PAPER = isDark ? "#020617" : "#f2f4f1";
  const INK = isDark ? "#f8fafc" : "#22301F";
  const LEDGER = isDark ? "#94a3b8" : "#3C5A45";
  const LEDGER_DARK = isDark ? "#cbd5e1" : "#28402F";
  const TURMERIC = isDark ? "#fbbf24" : "#C4901B";
  const STAMP_RED = isDark ? "#ef4444" : "#9C4A34";

  const [mess, setMess] = useState(null);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(null);
  const [saving, setSaving] = useState(false);

  const [showMembers, setShowMembers] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null); // { type, member }
  const [actionBusy, setActionBusy] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const [toast, setToast] = useState(null);
  const fileInputRef = useRef(null);
  const user = GetUser();
  const userId = user?.user?.id;
  const router = useRouter();
  

  function flashToast(text) {
    setToast(text);
    setTimeout(() => setToast(null), 2200);
  }

  // ---- generic API helper --------------------------------------------------
  const callApi = useCallback(async (url, method = "GET", body = null) => {
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined,
      });
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("API error:", err);
      return {
        success: false,
        message: "Network error — is the server running?",
      };
    }
  }, []);

  // ---- load mess + members --------------------------------------------------
  const loadAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setLoadError("");

    const [messRes, membersRes] = await Promise.all([
      callApi(`/api/manager/my-mess/${userId}`),
      callApi(`/api/manager/members/${userId}`),
    ]);

    if (!messRes.success) {
      setLoadError(messRes.message || "Couldn't load your mess");
      setLoading(false);
      return;
    }

    setMess(messRes);
    setMembers(membersRes.success ? membersRes.data : []);
    setLoading(false);
  }, [userId, callApi]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const manager = members.find((m) => m.role === "manager");

  // ---- image upload (client-side preview -> sent as messImage) -----------

  async function uploadToCloudinary(file) {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await res.json();
    if (data.secure_url) {
      return data.secure_url;
    } else {
      throw new Error("failed to upload image to Cloudinary");
    }
  }

  const [cropImageSrc, setCropImageSrc] = useState(null);

  // handlePickImage - File select হলে crop modal ওপেন করা
  function handlePickImage(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCropImageSrc(URL.createObjectURL(file));
  }

  async function handleCroppedImageApply({ file }) {
    setCropImageSrc(null);
    try {
      flashToast("Uploading mess photo...");
      const imageUrl = await uploadToCloudinary(file);
      setDraft((d) => ({ ...d, messImage: imageUrl }));
      flashToast("Mess photo updated");
    } catch (err) {
      console.error(err);
      flashToast("Failed to upload image, please try again");
    }
  }

  // ---- actions wired to the real backend ----------------------------------
  async function saveMessDetails() {
    setSaving(true);
    const res = await callApi(`/api/manager/my-mess`, "PATCH", {
      userId,
      messId: mess.messId,
      messName: draft.messName,
      messImage: draft.messImage,
      messLocation: draft.messLocation,
    });
    setSaving(false);

    if (!res.success) {
      flashToast(res.message || "Couldn't update mess");
      return;
    }
    setEditing(false);
    flashToast("Mess details updated");
    loadAll();
  }

  async function copyInviteCode() {
    const text = mess.inviteCode;

    const legacyCopy = () => {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.left = "-9999px";
      document.body.appendChild(textarea);
      textarea.focus();
      textarea.select();
      let ok = false;
      try {
        ok = document.execCommand("copy");
      } catch (e) {
        ok = false;
      }
      document.body.removeChild(textarea);
      return ok;
    };

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(text)
        .then(() => flashToast("Invite code copied"))
        .catch(() =>
          flashToast(
            legacyCopy()
              ? "Invite code copied"
              : "Couldn't copy — copy it manually",
          ),
        );
    } else {
      flashToast(
        legacyCopy()
          ? "Invite code copied"
          : "Couldn't copy — copy it manually",
      );
    }
  }

  async function generateInviteCode() {
    setSpinning(true);
    const res = await callApi(`/api/manager/invite-code`, "PATCH", {
      userId,
      messId: mess.messId,
    });
    setSpinning(false);

    if (!res.success) {
      flashToast(res.message || "Couldn't generate a new code");
      return;
    }
    setMess((m) => ({ ...m, inviteCode: res.inviteCode }));
    flashToast("New invite code stamped");
  }

  async function transferManager(member) {
    setActionBusy(true);
    const res = await callApi(`/api/manager/transfer-manager`, "PATCH", {
      userId,
      messId: mess.messId,
      newManagerId: member.userId,
    });
    setActionBusy(false);
    setConfirmAction(null);

    if (!res.success) {
      flashToast(res.message || "Couldn't transfer manager role");
      return;
    }
    flashToast(`${member.name} is now the manager`);
    router.push("/dashboard");
  }

  async function removeMember(member) {
    console.log("member._id:", member._id, "messId:", mess.messId);
    setActionBusy(true);
    const res = await callApi(`/api/manager/member/${member._id}`, "DELETE", {
      userId,
      messId: mess.messId,
    });
    setActionBusy(false);
    setConfirmAction(null);

    if (!res.success) {
      flashToast(res.message || "Couldn't remove member");
      return;
    }
    setMembers((prev) => prev.filter((m) => m._id !== member._id));
    flashToast(`${member.name} removed from the mess`);
  }

  // ---- loading / error states ---------------------------------------------
  if (loading) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center border-none rounded-2xl "
        style={{ background: PAPER }}
      >
        <div className="flex items-center  gap-2 ff-body" style={{ color: INK }}>
          <Loader2 size={18} className="animate-spin" />
          Loading your mess…
        </div>
        <style>{`.ff-body { font-family: 'Inter', sans-serif; }`}</style>
      </div>
    );
  }

  if (loadError || !mess) {
    return (
      <div
        className="min-h-screen w-full flex items-center justify-center px-4"
        style={{ background: PAPER }}
      >
        <div className="text-center max-w-sm">
          <p className="ff-body text-sm" style={{ color: STAMP_RED }}>
            {loadError || "Couldn't load your mess"}
          </p>
          <button
            onClick={loadAll}
            className="ff-body mt-3 text-sm font-medium px-4 py-2 rounded-lg text-white"
            style={{ background: LEDGER }}
          >
            Try again
          </button>
        </div>
        <style>{`.ff-body { font-family: 'Inter', sans-serif; }`}</style>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen w-full border-none rounded-2xl"
      style={{
        background: PAPER,
        color: INK,
        fontFamily: "Georgia, 'Noto Serif', serif",
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:wght@400;600;700&family=JetBrains+Mono:wght@400;500&family=Inter:wght@400;500;600&display=swap');
        .ff-display { font-family: 'Fraunces', Georgia, serif; }
        .ff-body { font-family: 'Inter', sans-serif; }
        .ff-mono { font-family: 'JetBrains Mono', monospace; }
        .stamp-rotate { transform: rotate(-4deg); }
       .paper-card {
  background: ${isDark ? "#0f172a" : "#fbf8ef"};
  border: 1px solid ${isDark ? "#1e293b" : "rgba(34, 48, 31, 0.14)"};
  border-radius: 20px; 
  box-shadow: 0 1px 0 rgba(34, 48, 31, 0.06), 0 8px 24px -12px rgba(34, 48, 31, 0.18);
 
  overflow: hidden; 
}
      `}</style>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* ---- Header ---- */}
        <div className="mb-8 flex items-baseline justify-between">
          <div>
            <p
              className="ff-body text-xs tracking-[0.2em] uppercase"
              style={{ color: LEDGER }}
            >
              Register &middot; My Mess
            </p>
            <h1
              className="ff-display text-3xl sm:text-4xl font-semibold mt-1"
              style={{ color: INK }}
            >
              {mess.messName}
            </h1>
          </div>
        </div>

        {/* ---- Mess Details Card ---- */}
        <div className="paper-card rounded-2xl p-5 sm:p-7 mb-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Image + upload */}
            <div className="flex sm:flex-col items-center gap-3 sm:gap-2 shrink-0">
              <div className="relative">
                <div
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-xl overflow-hidden flex items-center justify-center"
                  style={{
                    background: LEDGER,
                    border: `2px solid ${LEDGER_DARK}`,
                  }}
                >
                  {(editing ? draft.messImage : mess.messImage) ? (
                    <Image
                      src={editing ? draft.messImage : mess.messImage}
                      alt={mess.messName}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <span className="ff-display text-3xl text-white/90">
                      {mess.messName.charAt(0)}
                    </span>
                  )}
                </div>
                {editing && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-2 -right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition-transform hover:scale-105"
                    style={{ background: TURMERIC }}
                    aria-label="Upload mess photo"
                  >
                    <Camera size={16} color="#FBF8EF" />
                  </button>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePickImage}
                />
              </div>
              {editing && (
                <input
                  type="text"
                  placeholder="or paste image URL"
                  value={
                    draft.messImage?.startsWith("data:")
                      ? ""
                      : draft.messImage || ""
                  }
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, messImage: e.target.value }))
                  }
                  className="ff-body text-xs w-full sm:w-28 px-2 py-1.5 rounded-md border bg-white/70 dark:bg-slate-900/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2"
                  style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(34,48,31,0.2)" }}
                />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              {!editing ? (
                <div className="space-y-2.5">
                  <DetailRow
                    icon={<MapPin size={15} />}
                    label={mess.messLocation}
                  />
                  <DetailRow
                    icon={<Users size={15} />}
                    label={`${members.length} members`}
                  />
                  <DetailRow
                    icon={<Crown size={15} />}
                    label={`Managed by ${manager?.name || "—"}`}
                  />
                  <DetailRow
                    icon={<Calendar size={15} />}
                    label={`Since ${new Date(mess.createdAt).toLocaleDateString(
                      "en-GB",
                      {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      },
                    )}`}
                  />
                </div>
              ) : (
                <div className="space-y-3">
                  <Field label="Mess name">
                    <input
                      value={draft.messName}
                      onChange={(e) =>
                        setDraft((d) => ({ ...d, messName: e.target.value }))
                      }
                      className="ff-body w-full px-3 py-2 rounded-lg border bg-white/70 dark:bg-slate-900/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2"
                      style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(34,48,31,0.2)" }}
                    />
                  </Field>
                  <Field label="Address">
                    <input
                      value={draft.messLocation}
                      onChange={(e) =>
                        setDraft((d) => ({
                          ...d,
                          messLocation: e.target.value,
                        }))
                      }
                      className="ff-body w-full px-3 py-2 rounded-lg border bg-white/70 dark:bg-slate-900/70 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2"
                      style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(34,48,31,0.2)" }}
                    />
                  </Field>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                {!editing ? (
                  <button
                    onClick={() => {
                      setDraft(mess);
                      setEditing(true);
                    }}
                    className="ff-body inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg text-white transition-opacity hover:opacity-90"
                    style={{ background: "#FF6900" }}
                  >
                    <Pencil size={14} /> Edit details
                  </button>
                ) : (
                  <>
                    <button
                      onClick={saveMessDetails}
                      disabled={saving}
                      className="ff-body inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-60"
                      style={{ background: "#FF6900" }}
                    >
                      {saving ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <Check size={14} />
                      )}
                      Save changes
                    </button>
                    <button
                      onClick={() => setEditing(false)}
                      disabled={saving}
                      className="ff-body inline-flex items-center gap-1.5 text-sm font-medium px-3.5 py-2 rounded-lg border"
                      style={{ borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(34,48,31,0.25)" }}
                    >
                      Cancel
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ---- Invite code stamp + actions ---- */}
        <div className="paper-card rounded-2xl p-5 sm:p-7 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div className="flex items-center gap-4">
              <button
                onClick={copyInviteCode}
                title="Click to copy"
                className="stamp-rotate w-20 h-20 rounded-full flex flex-col items-center justify-center shrink-0 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                style={{ border: `3px double ${STAMP_RED}`, color: STAMP_RED }}
              >
                <span className="ff-body text-[9px] tracking-widest uppercase">
                  Invite
                </span>
                <span className="ff-mono text-sm font-bold tracking-wider">
                  {mess.inviteCode}
                </span>
              </button>
              <div>
                <p className="ff-body text-sm font-medium">Mess invite code</p>
                <p className="ff-body text-xs opacity-60 mt-0.5 max-w-[26ch]">
                  Tap the stamp to copy, or share it so new members can send a
                  join request.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <button
                onClick={() => setShowQrModal(true)}
                className="ff-body inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg text-white shrink-0 transition-opacity hover:opacity-90 cursor-pointer"
                  style={{ background: "#ea580c" }}
                >
                <QrCode size={16} />
                View Mess QR
                </button>

                <button
                  onClick={generateInviteCode}
                  disabled={spinning}
                className="ff-body inline-flex items-center justify-center gap-2 text-sm font-medium px-4 py-2.5 rounded-lg text-white shrink-0 transition-opacity hover:opacity-90 disabled:opacity-60 cursor-pointer"
                  style={{ background: "#334155" }}
                >
                <RefreshCw size={15} className={spinning ? "animate-spin" : ""} />
                  New Code
                </button>
              </div>
            </div>
          </div>

        {/* ---- Members management ---- */}
        <div className="paper-card rounded-2xl p-5 sm:p-7">
          <button
            onClick={() => setShowMembers((s) => !s)}
            className="w-full flex items-center justify-between"
          >
            <div className="text-left">
              <p className="ff-display text-lg font-semibold">Members</p>
              <p className="ff-body text-xs opacity-60 mt-0.5">
                Transfer the manager role or remove someone from the mess
              </p>
            </div>
            <ChevronRight
              size={18}
              className="transition-transform"
              style={{
                transform: showMembers ? "rotate(90deg)" : "rotate(0deg)",
              }}
            />
          </button>

          {showMembers && (
            <div className="mt-5 space-y-2.5">
              {members.map((m) => (
                <div
                  key={m.userId}
                  className="flex items-center justify-between gap-3 px-3.5 py-3 rounded-xl"
                  style={{ background: "rgba(60,90,69,0.06)" }}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center shrink-0 overflow-hidden ff-display text-sm font-semibold text-white"
                      style={{
                        background: m.role === "manager" ? TURMERIC : LEDGER,
                      }}
                    >
                      {m.image ? (
                        <Image
                          src={m.image}
                          alt={m.name?.charAt(0)}
                          width={24}
                          height={24}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        m.name?.charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="ff-body text-sm font-medium truncate">
                        {m.name}
                      </p>
                      <p className="ff-body text-xs opacity-55">
                        {m.role === "manager" ? "Manager" : "Member"} &middot;
                        joined{" "}
                        {new Date(m.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </div>
                  </div>

                  {m.role !== "manager" && (
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        onClick={() =>
                          setConfirmAction({ type: "transfer", member: m })
                        }
                        title="Make manager"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
                        style={{ color: LEDGER }}
                      >
                        <Crown size={16} />
                      </button>
                      <button
                        onClick={() =>
                          setConfirmAction({ type: "remove", member: m })
                        }
                        title="Remove member"
                        className="w-8 h-8 rounded-lg flex items-center justify-center transition-colors hover:bg-black/5"
                        style={{ color: STAMP_RED }}
                      >
                        <UserMinus size={16} />
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ---- Confirm modal ---- */}
      {confirmAction && (
        <div
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center px-4 pb-4 sm:pb-0"
          style={{ background: "rgba(34,48,31,0.45)" }}
        >
          <div className="paper-card rounded-2xl w-full max-w-sm p-6">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
              style={{
                background:
                  confirmAction.type === "remove"
                    ? "rgba(156,74,52,0.12)"
                    : "rgba(196,144,27,0.14)",
                color: confirmAction.type === "remove" ? STAMP_RED : TURMERIC,
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h3 className="ff-display text-lg font-semibold mb-1.5">
              {confirmAction.type === "remove"
                ? "Remove this member?"
                : "Transfer manager role?"}
            </h3>
            <p className="ff-body text-sm opacity-70 leading-relaxed mb-5">
              {confirmAction.type === "remove"
                ? `${confirmAction.member.name} will lose access to this mess's meals, deposits and bazaar records.`
                : `${confirmAction.member.name} will become the manager. You'll continue as a regular member.`}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmAction(null)}
                disabled={actionBusy}
                className="ff-body flex-1 text-sm font-medium px-4 py-2.5 rounded-lg border"
                style={{ borderColor: "rgba(34,48,31,0.25)" }}
              >
                Cancel
              </button>
              <button
                onClick={() =>
                  confirmAction.type === "remove"
                    ? removeMember(confirmAction.member)
                    : transferManager(confirmAction.member)
                }
                disabled={actionBusy}
                className="ff-body flex-1 text-sm font-medium px-4 py-2.5 rounded-lg text-white transition-opacity hover:opacity-90 disabled:opacity-60 flex items-center justify-center gap-1.5"
                style={{
                  background:
                    confirmAction.type === "remove" ? "#FF6900" : "#FF6900",
                }}
              >
                {actionBusy && <Loader2 size={14} className="animate-spin" />}
                {confirmAction.type === "remove" ? "Remove" : "Transfer"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ---- Image Crop Modal ---- */}
      {cropImageSrc && (
        <ImageCropModal
          imageSrc={cropImageSrc}
          cropShape="rectangle"
          onApply={handleCroppedImageApply}
          onCancel={() => setCropImageSrc(null)}
        />
      )}

      {/* ---- Toast ---- */}
      {toast && (
        <div
          className="fixed bottom-5 left-1/2 -translate-x-1/2 ff-body text-sm text-white px-4 py-2.5 rounded-full shadow-lg z-50"
          style={{ background: "#ff6900" }}
        >
          {toast}
        </div>
      )}

      {/* Mess QR Code Modal */}
      <MessQRCodeModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        messInfo={
          mess
            ? {
                ...mess,
                messName: mess.messName,
                messImage: mess.messImage,
                inviteCode: mess.inviteCode,
                managerName: manager?.name || user?.user?.name,
              }
            : null
        }
      />
    </div>
  );
}

function DetailRow({ icon, label }) {
  return (
    <div
      className="flex items-center gap-2.5 ff-body text-sm text-[#22301F]/80 dark:text-[#f8fafc]/80"
    >
      <span className="text-[#3C5A45] dark:text-[#cbd5e1]">{icon}</span>
      {label}
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="ff-body text-xs font-medium opacity-60 mb-1 block">
        {label}
      </label>
      {children}
    </div>
  );
}
