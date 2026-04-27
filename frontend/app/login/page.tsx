"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import supabase, { supabaseConfigError } from "../../lib/supabase";

type AuthMode = "login" | "signup";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<AuthMode>("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    // If user is already logged in, send them straight to dashboard.
    async function checkExistingSession() {
      if (!supabase) {
        setError(supabaseConfigError);
        setCheckingAuth(false);
        return;
      }

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        router.replace("/dashboard");
        return;
      }

      setCheckingAuth(false);
    }

    checkExistingSession();
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!supabase) {
      setError(supabaseConfigError);
      return;
    }

    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (mode === "login") {
        const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          throw signInError;
        }

        router.push("/dashboard");
      } else {
        const { error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
          throw signUpError;
        }

        setSuccess("Signup successful. Redirecting to dashboard...");
        router.push("/dashboard");
      }
    } catch (authError) {
      const message = authError instanceof Error ? authError.message : "Authentication failed.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <main className="min-h-screen bg-gray-100 px-6 py-12 md:px-10">
        <div className="mx-auto max-w-md rounded-2xl bg-white p-8 text-sm text-slate-700 shadow-md">
          Checking account...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-100 px-6 py-12 md:px-10">
      <div className="mx-auto max-w-md rounded-2xl bg-white p-8 shadow-md">
        <h1 className="text-2xl font-bold text-slate-900">{mode === "login" ? "Welcome back" : "Create your account"}</h1>
        <p className="mt-2 text-sm text-slate-600">
          {mode === "login"
            ? "Login to access your Corelytics dashboard."
            : "Sign up in seconds and start using Corelytics."}
        </p>

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Login
          </button>
          <button
            type="button"
            onClick={() => setMode("signup")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
              mode === "signup" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600"
            }`}
          >
            Signup
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              placeholder="you@company.com"
              autoComplete="email"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-semibold text-slate-700" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none ring-blue-500 focus:ring"
              placeholder="********"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          {error ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p> : null}
          {success ? <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{success}</p> : null}

          <button
            type="submit"
            disabled={loading || !email || !password || !supabase}
            className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all duration-300 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Please wait..." : mode === "login" ? "Login" : "Create account"}
          </button>
        </form>

        <Link href="/" className="mt-5 inline-block text-sm font-semibold text-blue-700 hover:text-blue-800">
          Back to home
        </Link>
      </div>
    </main>
  );
}
