"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth-client";

export default function LandingPage() {
  const { data: session } = authClient.useSession();

  // Database থেকে পরে আনবা
  const hasMess = false;

  if (!session) {
    return (
      <div className="text-center py-20">
        Please Login
      </div>
    );
  }

  // First Time User
  if (!hasMess) {
    return (
      <section className="min-h-screen flex items-center justify-center">

        <div className="max-w-3xl w-full">

          <h1 className="text-5xl font-bold text-center">
            Welcome to EasyMess
          </h1>

          <p className="text-center mt-4 text-gray-500">
            Create your own mess or join an existing one
          </p>

          <div className="grid md:grid-cols-2 gap-8 mt-12">

            <Link
              href="/create-mess"
              className="
                border
                rounded-3xl
                p-10
                hover:shadow-xl
                transition
                bg-orange-400
                hover:bg-orange-450
              "
            >
              <h2 className="text-2xl font-bold">
                Create Mess
              </h2>

              <p className="mt-3 text-gray-900">
                Start and manage your own mess
              </p>
            </Link>

            <Link
              href="/join-mess"
              className="
                border
                rounded-3xl
                p-10
                hover:shadow-xl
                transition
                
              "
            >
              <h2 className="text-2xl font-bold">
                Join Mess
              </h2>

              <p className="mt-3 text-gray-500">
                Join an existing community
              </p>
            </Link>

          </div>

        </div>

      </section>
    );
  }

  // User already created/joined
  return (
    <section className="min-h-screen">

      <h1 className="text-4xl font-bold">
        Dashboard Content
      </h1>

    </section>
  );
}