"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "@/components/ui/button";
import { loginUser } from "@/lib/apis";
import { setCredentials } from "@/utils/slices/auth";
import type { AppDispatch, RootState } from "@/utils/state/store";
import { persistAuthSession, readAuthSession } from "@/utils/auth-storage";

const LoginPage = () => {
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const session = useSelector((state: RootState) => state.auth.session);

  const [ identifier, setIdentifier ] = useState("");
  const [ password, setPassword ] = useState("");
  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const [ error, setError] = useState<string | null>(null);
  const [ successMessage, setSuccessMessage ] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      const stored = readAuthSession();
      if (stored) {
        dispatch(setCredentials(stored));
      }
    } else {
      router.prefetch("/admin/files");
    }
  }, [session, dispatch, router]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!identifier.trim() || !password.trim()) {
      setError("Email/username and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const authSession = await loginUser({
        identifier: identifier.trim(),
        password
      });
      dispatch(setCredentials(authSession));
      persistAuthSession(authSession);
      setSuccessMessage("You are now signed in.");
      router.push("/");
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Unable to sign in right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 py-16 dark:bg-black">
      <div className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Enter your admin credentials to manage users.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-2">
            <label
              htmlFor="identifier"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Email or username
            </label>
            <input
              id="identifier"
              name="identifier"
              type="text"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-800"
              placeholder="admin@playbook.dev"
              autoComplete="username"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-800"
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          {successMessage ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {successMessage}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full"
            disabled={isSubmitting || !identifier.trim() || !password.trim()}
          >
            {isSubmitting ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-zinc-600 dark:text-zinc-300">
          Need to add a teammate?{" "}
          <Link
            href="/admin/users/add"
            className="font-semibold text-zinc-900 underline hover:text-zinc-700 dark:text-zinc-50 dark:hover:text-zinc-300"
          >
            Go to the admin console
          </Link>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
