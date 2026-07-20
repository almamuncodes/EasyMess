"use client";

import { GetUser } from "@/components/action/action";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { trackEvent } from "@/lib/analytics";


export default function CreateMessForm() {
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState(null);
  const user = GetUser();
  const userId = user?.user?.id;
  const creaotrName = user?.user?.name;
  const router = useRouter();

const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);

  const formData = new FormData(e.currentTarget);
  const data = Object.fromEntries(formData.entries());
  const imageFile = formData.get("image");

  try {
    // 1. Image upload — শুধু ছবি থাকলেই চেষ্টা করবে, fail হলেও mess creation আটকাবে না
    let imageUrl = ""; // fallback default image url দিতে পারো এখানে

    if (imageFile && imageFile.size > 0) {
      try {
        const imgData = new FormData();
        imgData.append("file", imageFile);
        imgData.append("upload_preset", process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
          { method: "POST", body: imgData }
        );
        const imgResult = await uploadRes.json();

        if (imgResult.secure_url) {
          imageUrl = imgResult.secure_url;
        } else {
          console.error("Image upload failed:", imgResult);
          toast.warning("Image upload failed, creating mess without image.");
        }
      } catch (imgErr) {
        console.error("Image upload error:", imgErr);
        toast.warning("Image upload failed, creating mess without image.");
      }
    }

    // 2. Submit Data to Server — এটা image upload এর success/fail এর উপর নির্ভর করবে না
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/createmess`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        messName: data.messName,
        messLocation: data.messLocation,
        messImage: imageUrl,
        createdBy: userId,
        creaotrName: creaotrName,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Failed to create mess");
    }

    if (result.success) {
      trackEvent("create_mess", { messName: data.messName });
      toast.success("Mess Created Successfully!");
      router.push(`/create-mess/${result.insertedId}`);
      return;
    }


    toast.error("Something went wrong!");
  } catch (err) {
    console.error(err);
    toast.error(`${err.message}`);
  } finally {
    setLoading(false);
  }
};

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) setPreview(URL.createObjectURL(file));
  };

  return (
    <section className="min-h-screen flex justify-center items-center p-4 bg-gray-50">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-lg bg-white p-6 md:p-10 rounded-3xl shadow-xl border border-gray-100"
      >
        <h1 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
          Create New Mess
        </h1>

        {/* Mess Name */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Mess Name</label>
          <input
            type="text"
            name="messName"
            placeholder="Enter mess name"
            required
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition"
          />
        </div>

        {/* Location */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Location</label>
          <input
            type="text"
            name="messLocation"
            placeholder="Enter location"
            required
            className="w-full p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-orange-400 outline-none transition"
          />
        </div>

        {/* Image Upload */}
        <div className="mb-5">
          <label className="block text-sm font-medium text-gray-600 mb-2">Upload Mess Image <span className="text-gray-400"> (optional) </span> </label>
          <input
            type="file"
            name="image"
            accept="image/*"
            
            onChange={handleImageChange}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-600 hover:file:bg-orange-100"
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-6">
            <img
              src={preview}
              alt="Preview"
              className="h-40 w-full object-cover rounded-2xl border-2 border-orange-100"
            />
          </div>
        )}

        <button
          disabled={loading}
          className={`w-full py-4 rounded-xl text-white font-bold text-lg transition ${
            loading ? "bg-gray-400 cursor-not-allowed" : "bg-orange-500 hover:bg-orange-600 shadow-lg"
          }`}
        >
          {loading ? "Creating..." : "Create Mess"}
        </button>
      </form>
    </section>
  );
}