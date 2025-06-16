// src/app/page.tsx  (or wherever your SignInPage lives)

"use client";

import React, { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { AiOutlineEye, AiOutlineEyeInvisible } from "react-icons/ai";

export default function SignInPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [error, setError] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Adjust backend URL for your environment
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:3000";

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const res = await fetch(
        `${backendUrl}/api/signindashboardadmin`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ email, password }),
        }
      );

      if (!res.ok) {
        const data = await res.json();
        setError(data.message || "Sign‑in failed");
        return;
      }

      // Redirect to the specified path or default to /dashboard
      const redirectTo = searchParams.get("redirectTo") || "/dashboard";
      router.push(redirectTo);
    } catch (err: unknown) {
      console.error("Sign‑in error:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="w-full h-screen flex items-center">
      <div className="w-[60%] max-lg:w-full flex justify-center items-center h-screen">
        <div className="px-8 flex flex-col w-[600px] h-[700px] bg-white bg-opacity-80 rounded-xl justify-center gap-4 z-10">
          <div className="flex flex-col gap-2 items-center">
            <h1 className="text-3xl font-bold mb-2">
              Bienvenue to Admin Dashboard
            </h1>
          </div>

          {error && <p className="text-red-500 mb-4">{error}</p>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="email" className="text-lg font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                placeholder="votremail@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                className="w-full h-12 border px-4 border-primary rounded-md focus:outline-none text-sm font-semibold"
              />
            </div>

            <div className="flex flex-col gap-1 relative">
              <label htmlFor="password" className="mb-1 text-lg font-medium">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  placeholder="*******"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  className="w-full border border-primary rounded-md px-3 py-2 pr-10 focus:outline-none text-lg font-semibold"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 flex items-center text-gray-500"
                >
                  {showPassword ? (
                    <AiOutlineEyeInvisible size={22} />
                  ) : (
                    <AiOutlineEye size={22} />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between m-4 text-sm font-semibold">
              <label className="inline-flex items-center text-gray-500">
                <input type="checkbox" className="mr-2 w-4 h-6 bg-blue-200" />
                <span>Remember me</span>
              </label>
              <Link
                href="/forgot-password"
                className="text-sm text-primary hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="h-[50px] w-full text-white text-lg font-semibold py-2 rounded-md bg-primary transition duration-200 mt-4 hover:bg-secondary"
            >
              {isSubmitting ? "Signing in..." : "Sign in to your account"}
            </button>
          </form>
        </div>
      </div>

      {/* Background Image */}
      <div className="fixed inset-0 -z-10">
        <Image
          src="/signin.jpg"
          alt="Sign in background"
          fill
          priority
          className="object-cover"
        />
      </div>
    </div>
  );
}
