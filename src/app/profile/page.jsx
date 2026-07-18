"use client";

import { authClient } from "@/lib/auth-client"; // তোমার auth client এর path যদি আলাদা হয়, এখানে বদলে নিও
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 2MB



export default function ProfilePage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [hasCredentialAccount, setHasCredentialAccount] = useState(false);

  const [isEditing, setIsEditing] = useState(false); // view mode vs edit mode
  const [showImageModal, setShowImageModal] = useState(false); // ছবিতে ক্লিক করলে বড় করে দেখানো

  // Edit profile state
  const [name, setName] = useState("");
  const [imagePreview, setImagePreview] = useState(""); // দেখানোর জন্য
  const [imageFile, setImageFile] = useState(null); // upload করার জন্য
  const [imageWarning, setImageWarning] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");

  // Change password state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState("");
  const imagebb = process.env.NEXT_PUBLIC_IMGBB_KEY;

  // পেজ লোড হওয়ার সময় session + accounts নিয়ে আসা
  useEffect(() => {
    async function loadProfile() {
      try {
        setLoading(true);

        const { data: session } = await authClient.getSession();
        if (!session?.user) {
          router.push("/login");
          return;
        }

        setUser(session.user);
        setName(session.user.name || "");
        setImagePreview(session.user.image || "");

        // এই user email+password দিয়ে account বানিয়েছে কিনা চেক করা
        // (Google দিয়ে login করলে credential account থাকবে না)
        const { data: accounts } = await authClient.listAccounts();
        const hasCredential = accounts?.some(
          (acc) => acc.providerId === "credential",
        );
        setHasCredentialAccount(!!hasCredential);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, [router]);

  // Image select হলে size check করা, তারপর preview দেখানো
  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > MAX_IMAGE_SIZE) {
      setImageWarning("Image must be smaller than 4MB. Please choose another image.");
      setImageFile(null);
      return;
    }

    setImageWarning("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file)); // instant preview
  }

  // Cloudinary এ ছবি upload করে তার URL রিটার্ন করে
  async function uploadImageToCloudinary(file) {
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
    if (!data.secure_url) {
      throw new Error("Image upload failed");
    }

    return data.secure_url;
  }

  // Save button - name এবং/অথবা image update করে
  async function handleSaveProfile() {
    try {
      setSavingProfile(true);
      setProfileMessage("");

      let imageUrl = user.image;

      // নতুন ছবি select করা হলে সেটা প্রথমে Cloudinary তে upload করা
      if (imageFile) {
        imageUrl = await uploadImageToCloudinary(imageFile);
      }

      const { error } = await authClient.updateUser({
        name,
        image: imageUrl,
      });

      if (error) throw new Error(error.message);

      setUser((prev) => ({ ...prev, name, image: imageUrl }));
      setImageFile(null);
      setProfileMessage("Profile updated successfully.");
      setIsEditing(false); // save হয়ে গেলে view mode এ ফিরে যাওয়া
    } catch (err) {
      console.error("Update profile failed:", err);
      setProfileMessage("Failed to update profile. Please try again.");
    } finally {
      setSavingProfile(false);
    }
  }

  // Edit বাতিল করলে সব field আগের অবস্থায় ফিরিয়ে আনা
  function handleCancelEdit() {
    setName(user.name || "");
    setImagePreview(user.image || "");
    setImageFile(null);
    setImageWarning("");
    setProfileMessage("");
    setIsEditing(false);
  }

  // Change password form submit
  async function handleChangePassword(e) {
    e.preventDefault();
    setPasswordMessage("");

    if (newPassword !== confirmPassword) {
      setPasswordMessage("New password and confirm password do not match.");
      return;
    }

    try {
      setChangingPassword(true);

      const { error } = await authClient.changePassword({
        currentPassword,
        newPassword,
        revokeOtherSessions: true, // password change হলে বাকি সব device থেকে logout
      });

      if (error) throw new Error(error.message);

      setPasswordMessage("Password changed successfully.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("Change password failed:", err);
      setPasswordMessage(err.message || "Failed to change password.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleLogout() {
    await authClient.signOut({
      fetchOptions: {
        onSuccess: () => router.push("/"),
      },
    });
  }

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="flex items-center gap-3 font-mono text-xs uppercase tracking-[0.2em] text-[#9a9691]">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#FF6900]" />
          Loading profile
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F1EC]">
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

      <div className="mx-auto max-w-xl space-y-5 px-4 py-10 font-body sm:py-14">
        <div className="flex items-baseline justify-between">
          <h1 className="font-display text-2xl font-semibold text-[#16181D]">
            Account
          </h1>
          <span className="font-meta text-[11px] uppercase tracking-[0.2em] text-[#9a9691]">
            Profile
          </span>
        </div>

        {/* ================= Section 1: Identity Card ================= */}
        <div className="relative overflow-hidden rounded-[28px] bg-white shadow-[0_1px_2px_rgba(22,24,29,0.04),0_8px_24px_-12px_rgba(22,24,29,0.12)] ring-1 ring-[#EAE7E0]">
          {!isEditing ? (
            // ---------- VIEW MODE ----------
            <div className="p-6 sm:p-8">
              <div className="flex items-start gap-5">
                <button
                  onClick={() => setShowImageModal(true)}
                  className="group relative shrink-0"
                  aria-label="View profile photo"
                >
                  <div className="h-20 w-20 -rotate-2 overflow-hidden rounded-2xl ring-2 ring-[#16181D]/[0.06] transition group-hover:-rotate-1 sm:h-24 sm:w-24">
                    <Image
                      src={user.image || "/default-avatar.png"}
                      alt={user.name}
                      width={112}
                      height={112}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  {hasCredentialAccount && (
                    <span className="absolute -bottom-1.5 -right-1.5 flex h-6 w-6 rotate-6 items-center justify-center rounded-full bg-[#FF6900] font-meta text-[10px] font-bold text-white ring-4 ring-white">
                      ✓
                    </span>
                  )}
                </button>

                <div className="min-w-0 flex-1 pt-1">
                  <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#FF6900]">
                    Member profile
                  </p>
                  <h2 className="font-display truncate text-2xl font-semibold text-[#16181D] sm:text-3xl">
                    {user.name}
                  </h2>
                  <p className="font-meta truncate text-sm text-[#6b6f76]">
                    {user.email}
                  </p>
                </div>

                <button
                  onClick={() => setIsEditing(true)}
                  className="shrink-0 rounded-full border border-[#16181D]/10 px-4 py-2 font-display text-xs font-semibold text-[#16181D] transition hover:border-[#FF6900] hover:text-[#FF6900]"
                >
                  Edit
                </button>
              </div>

              {/* perforated divider — identity-card tear line */}
              <div className="my-6 border-t border-dashed border-[#E7E5E1]" />

              <div className="flex flex-wrap items-center justify-between gap-2 font-meta text-[11px] uppercase tracking-wide text-[#9a9691]">
                <span>
                  Member since{" "}
                  {new Date(user.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
                <span>{hasCredentialAccount ? "Email login" : "Connected login"}</span>
              </div>
            </div>
          ) : (
            // ---------- EDIT MODE ----------
            <div className="p-6 sm:p-8">
              <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#FF6900]">
                Editing profile
              </p>
              <h2 className="font-display mt-1 text-xl font-semibold text-[#16181D]">
                Update your details
              </h2>

              <div className="mt-5 flex items-center gap-4">
                <div className="relative shrink-0">
                  <div className="h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-[#16181D]/[0.06]">
                    <Image
                      src={imagePreview || "/default-avatar.png"}
                      alt={name}
                      width={80}
                      height={80}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <label className="absolute -bottom-2 left-1/2 -translate-x-1/2 cursor-pointer rounded-full bg-[#16181D] px-2.5 py-1 font-meta text-[9px] uppercase tracking-wide text-white">
                    Change
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="hidden"
                    />
                  </label>
                </div>

                <div className="min-w-0">
                  <p className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
                    Email
                  </p>
                  <p className="truncate font-medium text-[#16181D]">{user.email}</p>
                </div>
              </div>

              {imageWarning && (
                <p className="mt-3 font-meta text-xs text-[#D4453A]">{imageWarning}</p>
              )}

              <div className="mt-5">
                <label className="font-meta text-[10px] uppercase tracking-wide text-[#9a9691]">
                  Full name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 w-full rounded-xl border border-[#E7E5E1] px-4 py-2.5 text-[#16181D] outline-none transition focus:border-[#FF6900] focus:ring-2 focus:ring-[#FF6900]/15"
                />
              </div>

              <div className="mt-6 flex gap-3">
                <button
                  onClick={handleCancelEdit}
                  className="flex-1 rounded-xl border border-[#E7E5E1] py-3 font-display text-sm font-semibold text-[#6b6f76] transition hover:bg-[#F6F5F3]"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveProfile}
                  disabled={savingProfile}
                  className="flex-1 rounded-xl bg-[#FF6900] py-3 font-display text-sm font-semibold text-white transition hover:bg-[#e55f00] disabled:opacity-60"
                >
                  {savingProfile ? "Saving…" : "Save changes"}
                </button>
              </div>

              {profileMessage && (
                <p className="mt-4 text-center font-meta text-xs text-[#6b6f76]">
                  {profileMessage}
                </p>
              )}
            </div>
          )}
        </div>

        {/* ================= Section 2: Account Security ================= */}
        {/* Google login user দের জন্য এই সেকশন দেখানো হবে না */}
        {hasCredentialAccount && (
          <div className="rounded-[28px] bg-white p-6 shadow-[0_1px_2px_rgba(22,24,29,0.04)] ring-1 ring-[#EAE7E0] sm:p-8">
            <p className="font-meta text-[10px] uppercase tracking-[0.25em] text-[#9a9691]">
              Security
            </p>
            <h2 className="font-display mt-1 text-xl font-semibold text-[#16181D]">
              Change password
            </h2>

            <form onSubmit={handleChangePassword} className="mt-5 space-y-3">
              <input
                type="password"
                placeholder="Current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-xl border border-[#E7E5E1] px-4 py-2.5 outline-none transition focus:border-[#FF6900] focus:ring-2 focus:ring-[#FF6900]/15"
              />
              <input
                type="password"
                placeholder="New password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-[#E7E5E1] px-4 py-2.5 outline-none transition focus:border-[#FF6900] focus:ring-2 focus:ring-[#FF6900]/15"
              />
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border border-[#E7E5E1] px-4 py-2.5 outline-none transition focus:border-[#FF6900] focus:ring-2 focus:ring-[#FF6900]/15"
              />

              <button
                type="submit"
                disabled={changingPassword}
                className="w-full rounded-xl bg-[#16181D] py-3 font-display text-sm font-semibold text-white transition hover:bg-black disabled:opacity-60"
              >
                {changingPassword ? "Updating…" : "Update password"}
              </button>
            </form>

            {passwordMessage && (
              <p className="mt-4 text-center font-meta text-xs text-[#6b6f76]">
                {passwordMessage}
              </p>
            )}
          </div>
        )}

        {/* ================= Section 3: Logout ================= */}
        <button
          onClick={handleLogout}
          className="w-full rounded-[28px] border border-[#E7E5E1] bg-white py-3.5 font-display text-sm font-semibold text-[#D4453A] shadow-[0_1px_2px_rgba(22,24,29,0.04)] transition hover:border-[#D4453A]/30 hover:bg-[#D4453A]/[0.04]"
        >
          Log out
        </button>
      </div>

      {/* ================= Image Lightbox Modal ================= */}
      {showImageModal && (
        <div
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 z-50 flex items-center justify-center bg-[#16181D]/80 p-4 backdrop-blur-sm"
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Image
              src={user.image || "/default-avatar.png"}
              alt={user.name}
              width={1000}
              height={1000}
              className="h-auto w-[80vw] max-w-md rounded-[24px] object-cover"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -right-3 -top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white font-meta text-[#16181D] shadow"
              aria-label="Close"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}