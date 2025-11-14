"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PromptInput from "@/components/application/prompt-input";
import { useAppDispatch, useAppSelector } from "@/utils/state/hooks";
import { RootState } from "@/utils/state/store";
import { readAuthSession } from "@/utils/auth-storage";
import { setCredentials, setUserAuthState } from "@/utils/slices/auth";
import Authorising from "@/components/application/authorising";
import SystemStatsPanel from "@/components/application/system-stats";

type AuthState = "checking" | "authorized" | "unauthorized";

export default function Home() {
  const repoUrl = "https://github.com/rhit99900/playbook";
  const router = useRouter();
  const dispatch = useAppDispatch();
  const session = useAppSelector((state: RootState) => state.auth.session);
  const authState = useAppSelector((state: RootState) => state.auth.authState);

  useEffect(() => {
    if (session) {
      dispatch(setUserAuthState("authorized"));
      return;
    }

    const stored = readAuthSession();
    if (stored) {
      dispatch(setCredentials(stored));
      dispatch(setUserAuthState("authorized"));
      return;
    }

    dispatch(setUserAuthState("unauthorized"));
    router.replace("/login");
  }, [session, dispatch, router]);

  if (authState !== "authorized") {
    return (
      <Authorising />
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">      
      <main className="container flex min-h-screen w-full flex-col items-center justify-between bg-white px-6 md:px-16 py-32 dark:bg-black sm:items-start">
        <div className="flex w-full flex-col gap-8">
          <PromptInput />
          <SystemStatsPanel token={session?.token} />
          <section className="rounded-xl border border-border/70 bg-muted/30 p-6 text-sm leading-relaxed shadow-sm dark:bg-muted/10">
            <h2 className="text-lg font-semibold">Playbook</h2>
            <p className="mt-2 text-muted-foreground">
              This interface is backed by the{" "}
              <Link
                href={repoUrl}
                target="_blank"
                rel="noreferrer"
                className="font-medium text-primary underline-offset-2 hover:underline"
              >
                Playbook GitHub repository
              </Link>
              , which contains the full Express + Next.js codebase, Database schema, and builder scripts used to ingest Google Drive documents. Explore the code, file issues, or open a pull request to contribute improvements.
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
