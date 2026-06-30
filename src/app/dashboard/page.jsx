'use client';
import { GetUser } from '@/components/action/action';
import { AlertTriangle, Home, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';

const Page = () => {
  const [role, setRole] = useState(null); 
  const [loading, setLoading] = useState(true); 
  const user = GetUser();
  const userId = user?.user?.id;
  const router = useRouter();
  // if no user 
 useEffect(() => {
  if (!user) {
    router.push("/signin");
  }
}, [user, router]);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        const res = await fetch(`http://localhost:5000/api/member/role/${userId}`);
        const data = await res.json();
        setRole(data.role);
      } catch (error) {
        console.error("Error fetching role:", error);
      } finally {
        setLoading(false); 
      }
    };

    fetchUserRole();
  }, [userId]);

//  5 second spener 
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50">
        <Loader2 className="w-12 h-12 text-orange-500 animate-spin mb-4" />
        <p className="text-gray-500 font-medium">Checking your mess access...</p>
      </div>
    );
  }

  // if no member 
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
        <div className="w-full max-w-lg bg-white p-8 rounded-3xl shadow-lg border border-gray-100 flex flex-col items-center text-center">
          <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6">
            <AlertTriangle className="w-12 h-12 text-orange-500" />
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-800 mb-3">
            Mess Access Required
          </h1>
          <p className="text-gray-500 mb-8 max-w-sm">
            You are not a member of any mess yet. Please create a new mess or join an existing one to access the dashboard.
          </p>
          <Link
            href="/"
            className="flex items-center gap-2 px-8 py-3 rounded-xl bg-orange-500 text-white font-semibold hover:bg-orange-600 transition-all shadow-md hover:shadow-orange-200"
          >
            <Home size={20} />
            Back to Home
          </Link>
        </div>
      </div>
    );
  }



 
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Welcome, your role is: {role}</h1>
      <p>Dashboard content goes here...</p>
    </div>
  );
};

export default Page;