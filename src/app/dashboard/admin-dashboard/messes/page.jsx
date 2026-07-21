"use client";
import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import {
  Trash2,
  MapPin,
  RefreshCcw,
  Lock,
  Building2,
  Users,
  Inbox,
  ChevronDown,
  ChevronRight,
  X,
  AlertTriangle,
  Info,
  Search,
  ShieldCheck,
} from "lucide-react";
import { useSession } from "@/lib/auth-client";

const API_BASE = process.env.NEXT_PUBLIC_API_URL;

/* ---------------------------------------------------------------------- */
/*  Shell — shared page chrome, identical to AdminOverviewPage            */
/* ---------------------------------------------------------------------- */
function Shell({ children }) {
  return (
    <div className="min-h-screen bg-[#F3F1EC] border rounded-xl border-[#E7E5E1]">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&family=Inter:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap");
        .font-display {
          font-family: "Space Grotesk", sans-serif;
        }
        .font-body {
          font-family: "Inter", sans-serif;
        }
        .font-meta {
          font-family: "IBM Plex Mono", monospace;
        }
      `}</style>
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  StatTile — same tile used on the overview page                        */
/* ---------------------------------------------------------------------- */
function StatTile({ icon, label, value, accent = false }) {
  return (
    <div className="rounded-[22px] bg-white p-5 shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0]">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-full ${
          accent ? "bg-[#FF6900] text-white" : "bg-[#16181D]/[0.05] text-[#16181D]"
        }`}
      >
        {icon}
      </div>
      <p className="font-display mt-3 text-2xl font-semibold text-[#16181D]">
        {value}
      </p>
      <p className="font-meta text-[10px] uppercase tracking-[0.2em] text-[#9a9691]">
        {label}
      </p>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Modal — replaces every window.alert() in this page                    */
/* ---------------------------------------------------------------------- */
function Modal({ open, onClose, tone = "neutral", eyebrow, title, description, actions }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  const iconWrap =
    tone === "danger"
      ? "bg-[#D4453A]/10 text-[#D4453A]"
      : tone === "info"
      ? "bg-[#16181D]/[0.05] text-[#16181D]"
      : "bg-[#16181D]/[0.05] text-[#16181D]";

  const Icon = tone === "danger" ? AlertTriangle : Info;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center px-4 pb-20 md:pb-4"
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-[#16181D]/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-sm rounded-[28px] bg-white p-6 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04),0_8px_24px_-12px_rgba(22,24,29,0.12)] ring-1 ring-[#EAE7E0] sm:p-8">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 rounded-full p-1.5 text-[#9a9691] transition hover:bg-[#F3F1EC] hover:text-[#16181D]"
        >
          <X className="h-4 w-4" strokeWidth={2} />
        </button>

        <div className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${iconWrap}`}>
          <Icon className="h-5 w-5" strokeWidth={1.75} />
        </div>

        {eyebrow ? (
          <p
            className={`font-meta mt-4 text-[10px] uppercase tracking-[0.25em] ${
              tone === "danger" ? "text-[#D4453A]" : "text-[#FF6900]"
            }`}
          >
            {eyebrow}
          </p>
        ) : null}

        <h2 className="font-display mt-1 text-lg font-semibold text-[#16181D]">
          {title}
        </h2>

        {description ? (
          <p className="mt-2 text-sm text-[#6b6f76]">{description}</p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          {actions}
        </div>
      </div>
    </div>
  );
}

function ModalButton({ variant = "secondary", children, ...props }) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-full px-5 py-2.5 font-display text-xs font-semibold transition sm:flex-1";
  const styles =
    variant === "danger"
      ? "bg-[#D4453A] text-white hover:bg-[#c13b31]"
      : variant === "primary"
      ? "bg-[#16181D] text-white hover:bg-[#16181D]/90"
      : "border border-[#16181D]/10 text-[#16181D] hover:border-[#FF6900] hover:text-[#FF6900]";
  return (
    <button className={`${base} ${styles}`} {...props}>
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------------- */
/*  Avatar                                                                 */
/* ---------------------------------------------------------------------- */
function Avatar({ name, src, size = 44 }) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #16181D 0%, #FF6900 100%)",
          color: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontWeight: 700,
          fontSize: size * 0.35,
          flexShrink: 0,
        }}
      >
        {name ? name[0].toUpperCase() : "?"}
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={name}
      width={size}
      height={size}
      unoptimized
      onError={() => setFailed(true)}
      className="shrink-0 rounded-full object-cover"
      style={{ width: size, height: size }}
    />
  );
}

/* ---------------------------------------------------------------------- */
/*  Manager badge — small pill shown next to a manager's name             */
/* ---------------------------------------------------------------------- */
function ManagerBadge() {
  return (
    <span className="font-meta inline-flex items-center gap-1 rounded-full bg-[#FF6900]/10 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-[#FF6900]">
      <ShieldCheck className="h-2.5 w-2.5" strokeWidth={2.5} />
      Manager
    </span>
  );
}

/* ---------------------------------------------------------------------- */
/*  Helper — figure out whether a given member is the mess's manager      */
/*  Handles a few common backend shapes so this keeps working regardless  */
/*  of which one your API actually returns:                               */
/*    - mess.managerId (string id) matching member._id                    */
/*    - mess.manager as a populated object ({ _id, ... }) or a raw id     */
/*    - member.role === "manager" / "admin"                               */
/*    - member.isManager === true                                         */
/* ---------------------------------------------------------------------- */
function isMessManager(mess, member) {
  if (!mess || !member) return false;

  if (member.isManager) return true;

  if (member.role && ["manager", "admin"].includes(String(member.role).toLowerCase())) {
    return true;
  }

  const managerRef = mess.managerId ?? mess.manager ?? mess.managerID ?? null;
  const managerRefId =
    managerRef && typeof managerRef === "object" ? managerRef._id : managerRef;

  if (managerRefId && member._id && String(managerRefId) === String(member._id)) {
    return true;
  }

  // Fallback: some APIs mark the mess creator/owner as manager
  const ownerRef = mess.ownerId ?? mess.createdBy ?? null;
  const ownerRefId = ownerRef && typeof ownerRef === "object" ? ownerRef._id : ownerRef;
  if (ownerRefId && member._id && String(ownerRefId) === String(member._id)) {
    return true;
  }

  return false;
}

/* ---------------------------------------------------------------------- */
/*  MemberRow                                                              */
/* ---------------------------------------------------------------------- */
function MemberRow({ member, index, messId, mess, onDelete, isDeleting }) {
  const isManager = isMessManager(mess, member);

  return (
    <div className="flex items-center gap-3 rounded-2xl border border-[#16181D]/10 bg-white px-3 py-3">
      <span className="font-meta hidden w-6 shrink-0 text-xs text-[#9a9691] sm:block">
        {String(index + 1).padStart(2, "0")}
      </span>
      <Avatar name={member.name} src={member.image} size={36} />
      <div className="min-w-0 flex-1">
        <p className="font-display flex items-center gap-2 truncate text-sm font-semibold text-[#16181D]">
          <span className="truncate">{member.name}</span>
          {isManager ? <ManagerBadge /> : null}
        </p>
        <p className="font-meta truncate text-[11px] uppercase tracking-wide text-[#9a9691]">
          {member.email || "No email"}
        </p>
      </div>
      <button
        onClick={() => onDelete(messId, member)}
        disabled={isDeleting}
        className="shrink-0 rounded-full p-2 text-[#D4453A] transition hover:bg-[#fdf2ee] disabled:opacity-50"
        aria-label={`Delete ${member.name}`}
      >
        <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/*  Main page                                                              */
/* ---------------------------------------------------------------------- */
export default function AdminMessRegistry() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "admin";
  const adminId = session?.user?.id || session?.user?._id;

  const [messes, setMesses] = useState(() => {
    if (typeof window !== "undefined" && adminId) {
      const cached = sessionStorage.getItem(`admin_all_messes_${adminId}`);
      if (cached) {
        try { return JSON.parse(cached); } catch (e) {}
      }
    }
    return [];
  });
  const [loading, setLoading] = useState(() => messes.length === 0);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [deleting, setDeleting] = useState(null);
  const [deletingMemberId, setDeletingMemberId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [expandedMessId, setExpandedMessId] = useState(null);

  // Modal replacing every alert()
  const [modal, setModal] = useState({ open: false });
  const closeModal = () => setModal({ open: false });

  const loadMesses = useCallback(async () => {
    if (!adminId) return;

    if (typeof window !== "undefined") {
      const cached = sessionStorage.getItem(`admin_all_messes_${adminId}`);
      if (cached) {
        try { setMesses(JSON.parse(cached)); } catch (e) {}
      } else {
        if (messes.length === 0) setLoading(true);
      }
    }

    setError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/all-mess-details?userId=${adminId}`);
      const data = await res.json();

      if (data.success) {
        const newMesses = data.data || [];
        setMesses(newMesses);
        if (typeof window !== "undefined") {
          sessionStorage.setItem(`admin_all_messes_${adminId}`, JSON.stringify(newMesses));
        }
      } else {
        if (messes.length === 0) setError(data.message || "Unable to load messes.");
      }
    } catch (err) {
      setError("Failed to connect to backend. Check your internet connection.");
      console.error("Load messes error:", err);
    } finally {
      setLoading(false);
    }
  }, [adminId]);

  useEffect(() => {
    if (!isAdmin || !adminId) return;

    let active = true;
    const run = async () => {
      await loadMesses();
      if (!active) return;
    };

    void run();

    return () => {
      active = false;
    };
  }, [adminId, isAdmin, loadMesses]);

  const performDeleteMess = async (messId) => {
    setDeleting(messId);
    setDeleteError("");

    try {
      const res = await fetch(`${API_BASE}/api/admin/mess/${messId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: adminId }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete mess.");
      }

      setMesses((prev) => prev.filter((mess) => mess._id !== messId));
    } catch (err) {
      setDeleteError(err.message || "Failed to delete mess.");
      console.error("Delete mess error:", err);
    } finally {
      setDeleting(null);
      closeModal();
    }
  };

  const handleDeleteMess = (mess) => {
    setModal({
      open: true,
      tone: "danger",
      eyebrow: "Confirm deletion",
      title: `Delete "${mess.messName}"?`,
      description:
        "This removes the mess and its member records permanently. This action cannot be undone.",
      actions: (
        <>
          <ModalButton variant="secondary" onClick={closeModal}>
            Cancel
          </ModalButton>
          <ModalButton ClassName="bg-[#D4453A] text-white hover:bg-[#c13b31]" onClick={() => performDeleteMess(mess._id)}>
            {deleting === mess._id ? "Deleting..." : "Delete mess"}
          </ModalButton>
        </>
      ),
    });
  };

  const performDeleteMember = async (messId, member) => {
    setDeletingMemberId(member._id);
    setDeleteError("");

    try {
      const res = await fetch(
        `${API_BASE}/api/admin/mess/${messId}/member/${member._id}`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: adminId }),
        }
      );

      const data = await res.json().catch(() => ({}));

      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to delete member.");
      }

      // Remove the member locally so the UI updates without a full refetch
      setMesses((prev) =>
        prev.map((mess) =>
          mess._id === messId
            ? {
                ...mess,
                members: (mess.members || []).filter((m) => m._id !== member._id),
                totalMembers: (mess.totalMembers || mess.members?.length || 1) - 1,
              }
            : mess
        )
      );
    } catch (err) {
      setDeleteError(err.message || "Failed to delete member.");
      console.error("Delete member error:", err);
    } finally {
      setDeletingMemberId(null);
      closeModal();
    }
  };

  const handleDeleteMember = (messId, member) => {
    setModal({
      open: true,
      tone: "danger",
      eyebrow: "Confirm deletion",
      title: `Remove "${member.name}"?`,
      description: `This removes ${member.name} from this mess permanently. This action cannot be undone.`,
      actions: (
        <>
          <ModalButton variant="secondary" onClick={closeModal}>
            Cancel
          </ModalButton>
          <ModalButton
            ClassName="bg-[#D4453A] text-white hover:bg-[#c13b31]"
            onClick={() => performDeleteMember(messId, member)}
          >
            {deletingMemberId === member._id ? "Removing..." : "Remove member"}
          </ModalButton>
        </>
      ),
    });
  };

  // Filter messes based on search query
  const filteredMesses = messes.filter(
    (mess) =>
      mess.messName?.toLowerCase().includes(query.toLowerCase()) ||
      mess.messLocation?.toLowerCase().includes(query.toLowerCase())
  );

  const totalMembers = messes.reduce((sum, m) => sum + (m.members?.length || 0), 0);
  const maxMembers = Math.max(1, ...messes.map((m) => m.members?.length || 0));

  /* ---------------------------- Loading ---------------------------- */
  if (status === "loading") {
    return (
      <Shell>
        <div className="flex min-h-[50vh] items-center justify-center">
          <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[#9a9691]">
            <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6900]" />
            Loading registry
          </div>
        </div>
      </Shell>
    );
  }

  /* -------------------------- Unauthorized -------------------------- */
  if (!isAdmin) {
    return (
      <Shell>
        <div className="flex min-h-[50vh] items-center justify-center px-4">
          <div className="max-w-sm rounded-[28px] bg-white p-8 text-center shadow-[0_1px_2px_rgba(22,24,29,0.04),0_8px_24px_-12px_rgba(22,24,29,0.12)] ring-1 ring-[#EAE7E0]">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#16181D]/[0.05]">
              <Lock className="h-5 w-5 text-[#16181D]" strokeWidth={1.75} />
            </div>
            <p className="font-meta mt-4 text-[10px] uppercase tracking-[0.25em] text-[#FF6900]">
              Access denied
            </p>
            <h2 className="font-display mt-1 text-lg font-semibold text-[#16181D]">
              Admins only
            </h2>
            <p className="mt-2 text-sm text-[#6b6f76]">
              This registry is restricted to admin accounts.
            </p>
          </div>
        </div>
      </Shell>
    );
  }

  /* ------------------------------ Page ------------------------------ */
  return (
    <Shell>
      <div className="mx-auto max-w-4xl space-y-5 px-4 py-10 font-body sm:py-14">
        {/* Header */}
        <div className="flex items-baseline justify-between gap-3">
          <div className="min-w-0">
            <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#FF6900]">
              Admin console
            </p>
            <h1 className="font-display truncate text-2xl font-semibold text-[#16181D]">
              Mess registry
            </h1>
          </div>
          <button
            onClick={loadMesses}
            aria-label="Refresh"
            className="shrink-0 rounded-full border border-[#16181D]/10 p-2 text-[#6b6f76] transition hover:border-[#FF6900] hover:text-[#FF6900]"
          >
            <RefreshCcw className="h-4 w-4" strokeWidth={2} />
          </button>
        </div>

        {/* Stat tiles */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatTile
            icon={<Building2 className="h-4 w-4" strokeWidth={1.75} />}
            label="Total messes"
            value={messes.length}
          />
          <StatTile
            icon={<Users className="h-4 w-4" strokeWidth={1.75} />}
            label="Total members"
            value={totalMembers}
          />
          <StatTile
            icon={<Inbox className="h-4 w-4" strokeWidth={1.75} />}
            label="Matching search"
            value={filteredMesses.length}
            accent={!!query}
          />
        </div>

        {/* Error banners */}
        {error ? (
          <div className="rounded-[28px] border border-[#f4d7d3] bg-[#fdf2ee] p-4 text-sm text-[#D4453A] shadow-[0_1px_2px_rgba(22,24,29,0.04)]">
            {error}
          </div>
        ) : null}

        {deleteError ? (
          <div className="rounded-[28px] border border-[#f4d7d3] bg-[#fdf2ee] p-4 text-sm text-[#D4453A] shadow-[0_1px_2px_rgba(22,24,29,0.04)]">
            {deleteError}
          </div>
        ) : null}

        {/* Ledger */}
        <div className="rounded-[28px] bg-white p-6 shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0] sm:p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#9a9691]">
                Ledger
              </p>
              <h2 className="font-display mt-1 text-lg font-semibold text-[#16181D]">
                Mess by member count
              </h2>
            </div>

            {/* Search bar — fixed alignment + width for larger screens */}
            <div className="relative w-full sm:w-72 lg:w-80">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9a9691]"
                strokeWidth={2}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by name or location..."
                className="w-full rounded-full border border-[#16181D]/10 bg-white py-2.5 pl-10 pr-4 text-sm text-[#16181D] outline-none transition placeholder:text-[#9a9691] focus:border-[#FF6900] focus:ring-2 focus:ring-[#FF6900]/10"
              />
              {query ? (
                <button
                  onClick={() => setQuery("")}
                  aria-label="Clear search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 text-[#9a9691] transition hover:bg-[#F3F1EC] hover:text-[#16181D]"
                >
                  <X className="h-3.5 w-3.5" strokeWidth={2} />
                </button>
              ) : null}
            </div>
          </div>

          {loading ? (
            <div className="mt-5 space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-16 animate-pulse rounded-[20px] bg-[#F3F1EC]" />
              ))}
            </div>
          ) : filteredMesses.length === 0 ? (
            <p className="mt-6 text-sm text-[#6b6f76]">
              {query ? "No messes match your search." : "No mess has been created yet."}
            </p>
          ) : (
            <div className="mt-5 divide-y divide-dashed divide-[#E7E5E1]">
              {filteredMesses.map((mess, idx) => {
                const isExpanded = expandedMessId === mess._id;
                const memberCount = mess.members?.length || 0;

                return (
                  <div key={mess._id} className="py-4">
                    <div className="flex items-center gap-3 sm:gap-4">
                      <button
                        onClick={() => setExpandedMessId(isExpanded ? null : mess._id)}
                        className="flex min-w-0 flex-1 items-center gap-3 text-left sm:gap-4"
                      >
                        <span className="font-meta hidden w-6 shrink-0 text-xs text-[#9a9691] sm:block">
                          {String(idx + 1).padStart(2, "0")}
                        </span>

                        <Avatar name={mess.messName} src={mess.messImage} size={44} />

                        <div className="min-w-0 flex-1">
                          <p className="font-display truncate text-sm font-semibold text-[#16181D]">
                            {mess.messName}
                          </p>
                          <p className="font-meta flex items-center gap-1 truncate text-[11px] uppercase tracking-wide text-[#9a9691]">
                            <MapPin className="h-3 w-3 shrink-0" strokeWidth={2} />
                            <span className="truncate">
                              {mess.messLocation || "No location set"}
                            </span>
                          </p>
                          <div className="mt-1.5 h-1.5 w-full max-w-[160px] overflow-hidden rounded-full bg-[#F3F1EC]">
                            <div
                              className="h-full rounded-full bg-[#FF6900]"
                              style={{ width: `${(memberCount / maxMembers) * 100}%` }}
                            />
                          </div>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="font-display text-lg font-semibold text-[#16181D]">
                            {memberCount}
                          </p>
                          <p className="font-meta hidden text-[10px] uppercase tracking-wide text-[#9a9691] sm:block">
                            members
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleDeleteMess(mess)}
                        disabled={deleting === mess._id}
                        className="shrink-0 rounded-full p-2 text-[#D4453A] transition hover:bg-[#fdf2ee] disabled:opacity-50"
                        aria-label={`Delete ${mess.messName}`}
                      >
                        <Trash2 className="h-4 w-4" strokeWidth={2} />
                      </button>

                      <button
                        onClick={() => setExpandedMessId(isExpanded ? null : mess._id)}
                        aria-label={isExpanded ? "Collapse" : "Expand"}
                        className="shrink-0 text-[#9a9691]"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" strokeWidth={2} />
                        ) : (
                          <ChevronRight className="h-4 w-4" strokeWidth={2} />
                        )}
                      </button>
                    </div>

                    {/* Expanded member list */}
                    {isExpanded ? (
                      <div className="mt-4 rounded-[20px] bg-[#F3F1EC] p-3 sm:p-4">
                        <div className="mb-3 flex items-center justify-between px-1">
                          <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#9a9691]">
                            Members
                          </p>
                          <span className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
                            {memberCount} total
                          </span>
                        </div>
                        <div className="space-y-2">
                          {memberCount > 0 ? (
                            mess.members.map((member, memberIdx) => (
                              <MemberRow
                                key={member._id || `${mess._id}-${memberIdx}`}
                                member={member}
                                index={memberIdx}
                                messId={mess._id}
                                mess={mess}
                                onDelete={handleDeleteMember}
                                isDeleting={deletingMemberId === member._id}
                              />
                            ))
                          ) : (
                            <div className="rounded-2xl border border-dashed border-[#16181D]/10 bg-white p-4 text-center text-sm text-[#9a9691]">
                              No members added yet
                            </div>
                          )}
                        </div>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Modal
        open={!!modal.open}
        onClose={closeModal}
        tone={modal.tone}
        eyebrow={modal.eyebrow}
        title={modal.title}
        description={modal.description}
        actions={modal.actions}
      />
    </Shell>
  );
}