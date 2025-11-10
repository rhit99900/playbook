"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { registerUser } from "@/lib/apis";
import type { RootState } from "@/utils/state/store";
import { setCredentials, signOut } from "@/utils/slices/auth";
import { clearAuthSession, readAuthSession } from "@/utils/auth-storage";
import { useAppDispatch, useAppSelector } from "@/utils/state/hooks";

const AddUserPage = () => {
  const dispatch = useAppDispatch();
  const session = useAppSelector((state: RootState) => state.auth.session);

  const [ email, setEmail ] = useState("");
  const [ username, setUsername ] = useState("");
  const [ password, setPassword ] = useState("");
  const [ isSubmitting, setIsSubmitting ] = useState(false);
  const [ error, setError ] = useState<string | null>(null);
  const [ status, setStatus ] = useState<string | null>(null);

  useEffect(() => {
    if (!session) {
      const stored = readAuthSession();
      if (stored) {
        dispatch(setCredentials(stored));
      }
    }
  }, [session, dispatch]);

  const handleSignOut = () => {
    clearAuthSession();
    dispatch(signOut());
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!session?.token) {
      setError("Please sign in as an admin before creating a user.");
      return;
    }

    if (!email.trim() || !username.trim() || !password.trim()) {
      setError("Email, username, and password are required.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setStatus(null);

    try {
      const created = await registerUser({
        email: email.trim(),
        username: username.trim(),
        password
      }, session.token);

      setStatus(`User ${created.user.username} was created successfully.`);
      setEmail("");
      setUsername("");
      setPassword("");
    } catch (error: any) {
      const message = error?.response?.data?.message || error?.message || "Unable to create the user right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 px-4 md:px-16 py-16 dark:bg-black">
      <div className="mx-auto w-full container rounded-2xl border border-zinc-200 bg-white p-8 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
              Admin console
            </p>
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
              Add a new user
            </h1>
          </div>
          <div className="text-right text-sm text-zinc-600 dark:text-zinc-300">
            {session ? (
              <>
                <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {session.user.username}
                </p>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="text-sm font-medium text-rose-600 underline hover:text-rose-500"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="font-semibold text-zinc-900 underline hover:text-zinc-700 dark:text-zinc-100 dark:hover:text-zinc-200"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-2">
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-800"
              placeholder="teammate@company.com"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="username"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Username
            </label>
            <input
              id="username"
              name="username"
              type="text"
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-800"
              placeholder="teammate"
              required
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="password"
              className="text-sm font-medium text-zinc-800 dark:text-zinc-200"
            >
              Temporary password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm text-zinc-900 focus:border-zinc-900 focus:outline-none focus:ring-2 focus:ring-zinc-200 dark:border-zinc-700 dark:text-zinc-50 dark:focus:border-zinc-50 dark:focus:ring-zinc-800"
              placeholder="Set a temporary password"
              required
            />
          </div>

          {error ? (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          ) : null}
          {status ? (
            <p className="text-sm text-emerald-600 dark:text-emerald-400">
              {status}
            </p>
          ) : null}

          <Button
            type="submit"
            className="w-full sm:w-auto"
            disabled={
              isSubmitting ||
              !email.trim() ||
              !username.trim() ||
              !password.trim()
            }
          >
            {isSubmitting ? "Creating user..." : "Create user"}
          </Button>
        </form>

        <div className="mt-6 text-sm text-zinc-600 dark:text-zinc-300">
          <p>
            Looking for the knowledge base instead?{" "}
            <Link
              href="/"
              className="font-semibold text-zinc-900 underline hover:text-zinc-700 dark:text-zinc-100"
            >
              Go back to the assistant.
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AddUserPage;
