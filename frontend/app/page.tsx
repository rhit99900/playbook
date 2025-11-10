"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import FilesList from "@/components/application/indexed-files-list";
import PromptInput from "@/components/application/prompt-input";
import { useAppDispatch, useAppSelector } from "@/utils/state/hooks";
import { RootState } from "@/utils/state/store";
import { readAuthSession } from "@/utils/auth-storage";
import { setCredentials, setUserAuthState } from "@/utils/slices/auth";
import Authorising from "@/components/application/authorising";

type AuthState = "checking" | "authorized" | "unauthorized";

export default function Home() {
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
        <PromptInput />
      </main>
    </div>
  );
}
