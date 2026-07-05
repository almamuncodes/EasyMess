"use client";

import { authClient } from "@/lib/auth-client"; // তোমার auth client এর path যদি আলাদা হয়, এখানে বদলে নিও
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB


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
  const imagebb= 'dd7b4d125163f0ed5537537a55851bab';

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
      setImageWarning("Image must be smaller than 2MB. Please choose another image.");
      setImageFile(null);
      return;
    }

    setImageWarning("");
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file)); // instant preview
  }

  // ImgBB এ ছবি upload করে তার URL রিটার্ন করে
  async function uploadImageToImgbb(file) {
    const formData = new FormData();
    formData.append("image", file);

    const res = await fetch(
      `https://api.imgbb.com/1/upload?key=${imagebb}`,
      {
        method: "POST",
        body: formData,
      },
    );

    const data = await res.json();
    if (!data.success) {
      throw new Error("Image upload failed");
    }

    return data.data.url;
  }

  // Save button - name এবং/অথবা image update করে
  async function handleSaveProfile() {
    try {
      setSavingProfile(true);
      setProfileMessage("");

      let imageUrl = user.image;

      // নতুন ছবি select করা হলে সেটা প্রথমে ImgBB তে upload করা
      if (imageFile) {
        imageUrl = await uploadImageToImgbb(imageFile);
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
        onSuccess: () => router.push("/login"),
      },
    });
  }

  if (loading) {
    return <div className="p-6 text-center text-gray-500">Loading...</div>;
  }

  return (
    <div className="max-w-2xl mx-auto p-4 space-y-6">
      <h1 className="text-2xl font-semibold text-gray-800">Profile</h1>

      {/* ================= Section 1: Personal Information ================= */}
      <div className="bg-white rounded-2xl shadow p-6">
        {!isEditing ? (
          // ---------- VIEW MODE ----------
          <div className="flex flex-col items-center text-center space-y-3">
            <button
              onClick={() => setShowImageModal(true)}
              className="rounded-full overflow-hidden ring-4 ring-gray-100 hover:ring-orange-200 transition"
            >
              <Image
                src={user.image || "/default-avatar.png"}
                alt={user.name}
                width={112}
                height={112}
                className="w-28 h-28 object-cover"
              />
            </button>

            <div>
              <h2 className="text-xl font-semibold text-gray-800">
                {user.name}
              </h2>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>

            <p className="text-xs text-gray-400">
              Joined on {new Date(user.createdAt).toLocaleDateString("en-US")}
            </p>

            <button
              onClick={() => setIsEditing(true)}
              className="mt-2 px-6 py-2 rounded-xl bg-[#FF6900] text-white font-medium"
            >
              Edit Profile
            </button>
          </div>
        ) : (
          // ---------- EDIT MODE ----------
          <div className="space-y-4">
            <h2 className="font-semibold text-gray-800">Edit Profile</h2>

            <div className="flex items-center gap-4">
              <div className="relative">
                <Image
                  src={imagePreview || "/default-avatar.png"}
                  alt={name}
                  width={80}
                  height={80}
                  className="w-20 h-20 rounded-full object-cover"
                />
                <label className="absolute bottom-0 right-0 bg-gray-800 text-white text-xs rounded-full px-2 py-1 cursor-pointer">
                  Edit
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="font-medium text-gray-800">{user.email}</p>
              </div>
            </div>

            {imageWarning && (
              <p className="text-sm text-red-600">{imageWarning}</p>
            )}

            <div>
              <label className="text-sm text-gray-500">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 border border-gray-200 rounded-xl px-4 py-2 text-gray-800"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleCancelEdit}
                className="flex-1 py-3 rounded-xl border border-gray-200 text-gray-600 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveProfile}
                disabled={savingProfile}
                className="flex-1 py-3 rounded-xl bg-[#FF6900] text-white font-medium disabled:opacity-60"
              >
                {savingProfile ? "Saving..." : "Save Changes"}
              </button>
            </div>

            {profileMessage && (
              <p className="text-sm text-center text-gray-600">
                {profileMessage}
              </p>
            )}
          </div>
        )}
      </div>

      {/* ================= Section 2: Account Security ================= */}
      {/* Google login user দের জন্য এই সেকশন দেখানো হবে না */}
      {hasCredentialAccount && (
        <div className="bg-white rounded-2xl shadow p-5 space-y-3">
          <h2 className="font-semibold text-gray-800">Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-3">
            <input
              type="password"
              placeholder="Current Password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-4 py-2"
            />
            <input
              type="password"
              placeholder="New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-200 rounded-xl px-4 py-2"
            />
            <input
              type="password"
              placeholder="Confirm New Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
              className="w-full border border-gray-200 rounded-xl px-4 py-2"
            />

            <button
              type="submit"
              disabled={changingPassword}
              className="w-full py-3 rounded-xl bg-gray-800 text-white font-medium disabled:opacity-60"
            >
              {changingPassword ? "Updating..." : "Update Password"}
            </button>
          </form>

          {passwordMessage && (
            <p className="text-sm text-center text-gray-600">
              {passwordMessage}
            </p>
          )}
        </div>
      )}

      {/* ================= Section 3: Logout ================= */}
      <button
        onClick={handleLogout}
        className="w-full py-3 rounded-xl border border-red-300 text-red-600 font-medium hover:bg-red-50"
      >
        Logout
      </button>

      {/* ================= Image Lightbox Modal ================= */}
      {showImageModal && (
        <div
          onClick={() => setShowImageModal(false)}
          className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50"
        >
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <Image
              src={user.image || "/default-avatar.png"}
              alt={user.name}
              width={1000}
              height={1000}
              className="w-[80vw] max-w-md h-auto rounded-2xl object-cover"
            />
            <button
              onClick={() => setShowImageModal(false)}
              className="absolute -top-3 -right-3 bg-white text-gray-800 rounded-full w-8 h-8 flex items-center justify-center shadow"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}