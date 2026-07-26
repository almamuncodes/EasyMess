"use client";
import React, { useEffect, useState, useMemo } from "react";
import { GetUser } from "@/components/action/action";
import { useTranslation } from "@/lib/useTranslation";
import { toast } from "sonner";
import Image from "next/image";
import {
  Users,
  Search,
  Filter,
  Shield,
  ShieldAlert,
  ShieldCheck,
  UserCheck,
  UserX,
  RefreshCcw,
  Check,
  X,
  Building,
} from "lucide-react";

export default function AdminUsersPage() {
  const user = GetUser();
  const adminUserId = user?.user?.id;
  const { lang } = useTranslation();
  const isBn = lang === "bn";

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal states
  const [roleModalUser, setRoleModalUser] = useState(null);
  const [newRole, setNewRole] = useState("member");
  const [statusModalUser, setStatusModalUser] = useState(null);
  const [newStatus, setNewStatus] = useState("active");
  const [processing, setProcessing] = useState(false);

  const fetchUsers = async () => {
    if (!adminUserId) return;
    setLoading(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/users?userId=${adminUserId}`
      );
      const data = await res.json();
      if (res.ok && data.success) {
        setUsers(data.data || []);
      } else {
        toast.error(data.message || (isBn ? "ইউজার লোড করতে ব্যর্থ" : "Failed to load users"));
      }
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "সার্ভার এরর" : "Server error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchUsers();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adminUserId]);

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const matchesSearch =
        u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.messInfo?.messName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesRole =
        roleFilter === "all" || u.role?.toLowerCase() === roleFilter.toLowerCase();

      const matchesStatus =
        statusFilter === "all" || u.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  const handleRoleChange = async () => {
    if (!roleModalUser || !adminUserId) return;
    setProcessing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/user/role`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminUserId,
            targetUserId: roleModalUser._id,
            newRole,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || (isBn ? "রোল পরিবর্তিত হয়েছে" : "Role updated"));
        setRoleModalUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || (isBn ? "রোল পরিবর্তন ব্যর্থ" : "Failed to update role"));
      }
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "সার্ভার এরর" : "Server error");
    } finally {
      setProcessing(false);
    }
  };

  const handleStatusChange = async () => {
    if (!statusModalUser || !adminUserId) return;
    setProcessing(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/admin/user/status`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            adminUserId,
            targetUserId: statusModalUser._id,
            newStatus,
          }),
        }
      );
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(data.message || (isBn ? "স্ট্যাটাস পরিবর্তিত হয়েছে" : "Status updated"));
        setStatusModalUser(null);
        fetchUsers();
      } else {
        toast.error(data.message || (isBn ? "স্ট্যাটাস পরিবর্তন ব্যর্থ" : "Failed to update status"));
      }
    } catch (err) {
      console.error(err);
      toast.error(isBn ? "সার্ভার এরর" : "Server error");
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="space-y-6 p-4 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
            <Users className="text-orange-500" size={26} />
            {isBn ? "সর্বজনীন ইউজার ম্যানেজমেন্ট" : "User Management Panel"}
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 dark:text-slate-400 mt-1">
            {isBn
              ? "সিস্টেমের সমস্ত ইউজারের তথ্য দেখুন, রোল পরিবর্তন করুন ও একাউন্ট নিয়ন্ত্রণ করুন।"
              : "Manage all system users, control roles, ban/unban accounts, and view mess affiliations."}
          </p>
        </div>
        <button
          onClick={fetchUsers}
          className="self-start sm:self-auto px-4 py-2 bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 rounded-xl text-xs font-semibold hover:bg-orange-100 transition flex items-center gap-1.5 cursor-pointer"
        >
          <RefreshCcw size={14} className={loading ? "animate-spin" : ""} />
          <span>{isBn ? "রিফ্রেশ" : "Refresh"}</span>
        </button>
      </div>

      {/* Filter & Search Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-sm">
        {/* Search */}
        <div className="sm:col-span-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder={isBn ? "নাম, ইমেইল বা মেসের নামে খুঁজুন..." : "Search name, email, or mess..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          />
        </div>

        {/* Role Filter */}
        <div className="sm:col-span-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="all">{isBn ? "সকল রোল (All Roles)" : "All Roles"}</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="member">Member</option>
          </select>
        </div>

        {/* Status Filter */}
        <div className="sm:col-span-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl text-sm outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
          >
            <option value="all">{isBn ? "সকল স্ট্যাটাস (All Status)" : "All Status"}</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Stats Counter */}
      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-slate-400 px-1">
        <span>
          {isBn
            ? `মোট ইউজার: ${filteredUsers.length} জন`
            : `Showing ${filteredUsers.length} of ${users.length} users`}
        </span>
      </div>

      {/* Users Content */}
      {loading ? (
        <div className="p-12 flex justify-center bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="p-12 text-center text-gray-500 dark:text-slate-400 bg-white dark:bg-slate-900 rounded-2xl border border-gray-100 dark:border-slate-800">
          {isBn ? "কোনো ইউজার পাওয়া যায়নি" : "No users match your criteria"}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-hidden rounded-2xl border border-gray-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-gray-50/70 dark:bg-slate-800/50 border-b border-gray-100 dark:border-slate-800 text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <th className="py-4 px-6">User</th>
                  <th className="py-4 px-4">Role</th>
                  <th className="py-4 px-4">Mess Affiliation</th>
                  <th className="py-4 px-4">Status</th>
                  <th className="py-4 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-slate-800">
                {filteredUsers.map((u, idx) => {
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven
                    ? "bg-white dark:bg-slate-900"
                    : "bg-orange-50/30 dark:bg-orange-950/10";
                  return (
                    <tr key={u._id} className={`${rowBg} hover:bg-gray-50/60 dark:hover:bg-slate-800/40 transition`}>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          {u.image ? (
                            <Image
                              src={u.image}
                              alt={u.name}
                              width={40}
                              height={40}
                              quality={40}
                              className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                              {u.name?.[0]?.toUpperCase() || "U"}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white text-sm">
                              {u.name}
                            </p>
                            <p className="text-xs text-gray-400">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                            u.role === "admin"
                              ? "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-300"
                              : u.role === "manager"
                              ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                              : "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          }`}
                        >
                          {u.role}
                        </span>
                      </td>
                      <td className="py-4 px-4">
                        {u.messInfo ? (
                          <div className="flex items-center gap-1.5 text-xs text-gray-700 dark:text-slate-300">
                            <Building size={14} className="text-orange-500" />
                            <span className="font-medium">{u.messInfo.messName}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400">Not in a Mess</span>
                        )}
                      </td>
                      <td className="py-4 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold capitalize ${
                            u.status === "banned"
                              ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                              : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                          }`}
                        >
                          {u.status === "banned" ? "Banned" : "Active"}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => {
                            setRoleModalUser(u);
                            setNewRole(u.role || "member");
                          }}
                          className="px-3 py-1.5 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                        >
                          Role
                        </button>
                        <button
                          onClick={() => {
                            setStatusModalUser(u);
                            setNewStatus(u.status === "banned" ? "active" : "banned");
                          }}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                            u.status === "banned"
                              ? "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400"
                              : "bg-rose-50 text-rose-600 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400"
                          }`}
                        >
                          {u.status === "banned" ? "Unban" : "Ban"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="block md:hidden space-y-3">
            {filteredUsers.map((u, idx) => {
              const isEven = idx % 2 === 0;
              const cardBg = isEven
                ? "bg-white dark:bg-slate-900"
                : "bg-orange-50/50 dark:bg-orange-950/15";
              return (
                <div
                  key={u._id}
                  className={`p-4 rounded-2xl border border-gray-100 dark:border-slate-800 space-y-3 ${cardBg}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {u.image ? (
                        <Image
                          src={u.image}
                          alt={u.name}
                          width={40}
                          height={40}
                          quality={40}
                          className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-600 dark:bg-orange-950 dark:text-orange-400 flex items-center justify-center font-bold text-sm">
                          {u.name?.[0]?.toUpperCase() || "U"}
                        </div>
                      )}
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">
                          {u.name}
                        </p>
                        <p className="text-xs text-gray-400">{u.email}</p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        u.status === "banned"
                          ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                          : "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300"
                      }`}
                    >
                      {u.status}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-100 dark:border-slate-800/60">
                    <div>
                      <span>Role: </span>
                      <span className="font-bold text-gray-800 dark:text-slate-200 capitalize">
                        {u.role}
                      </span>
                    </div>
                    <div>
                      {u.messInfo ? (
                        <span className="font-medium text-orange-600 dark:text-orange-400">
                          {u.messInfo.messName}
                        </span>
                      ) : (
                        <span className="text-gray-400">No Mess</span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => {
                        setRoleModalUser(u);
                        setNewRole(u.role || "member");
                      }}
                      className="w-full py-2 bg-gray-100 dark:bg-slate-800 hover:bg-gray-200 dark:hover:bg-slate-700 text-gray-700 dark:text-slate-200 rounded-xl text-xs font-semibold transition cursor-pointer"
                    >
                      Change Role
                    </button>
                    <button
                      onClick={() => {
                        setStatusModalUser(u);
                        setNewStatus(u.status === "banned" ? "active" : "banned");
                      }}
                      className={`w-full py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                        u.status === "banned"
                          ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400"
                          : "bg-rose-50 text-rose-600 dark:bg-rose-950/40 dark:text-rose-400"
                      }`}
                    >
                      {u.status === "banned" ? "Unban Account" : "Ban Account"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Role Modal */}
      {roleModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-sm w-full border border-gray-100 dark:border-slate-800 space-y-4 shadow-xl">
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              Change Role for {roleModalUser.name}
            </h3>
            <div className="space-y-2">
              {["member", "manager", "admin"].map((r) => (
                <label
                  key={r}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer ${
                    newRole === r
                      ? "border-orange-500 bg-orange-50/50 dark:bg-orange-950/30 text-orange-600 dark:text-orange-400 font-bold"
                      : "border-gray-200 dark:border-slate-700 text-gray-700 dark:text-slate-300"
                  }`}
                >
                  <span className="capitalize">{r}</span>
                  <input
                    type="radio"
                    name="userRole"
                    value={r}
                    checked={newRole === r}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="accent-orange-500"
                  />
                </label>
              ))}
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setRoleModalUser(null)}
                className="w-full py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRoleChange}
                disabled={processing}
                className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-semibold shadow-md shadow-orange-500/20"
              >
                {processing ? "Saving..." : "Save Role"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Status Ban Modal */}
      {statusModalUser && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl max-w-sm w-full border border-gray-100 dark:border-slate-800 space-y-4 shadow-xl text-center">
            <ShieldAlert size={40} className="mx-auto text-rose-500" />
            <h3 className="font-bold text-lg text-gray-900 dark:text-white">
              {newStatus === "banned" ? "Ban Account?" : "Unban Account?"}
            </h3>
            <p className="text-xs text-gray-500 dark:text-slate-400">
              Are you sure you want to change status of <b>{statusModalUser.name}</b> to <b>{newStatus}</b>?
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setStatusModalUser(null)}
                className="w-full py-2 bg-gray-100 dark:bg-slate-800 text-gray-700 dark:text-slate-300 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={processing}
                className={`w-full py-2 text-white rounded-xl text-xs font-semibold shadow-md ${
                  newStatus === "banned"
                    ? "bg-rose-500 hover:bg-rose-600 shadow-rose-500/20"
                    : "bg-emerald-500 hover:bg-emerald-600 shadow-emerald-500/20"
                }`}
              >
                {processing ? "Updating..." : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
