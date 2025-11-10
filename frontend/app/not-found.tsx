"use client";

import { CircleOff } from "lucide-react";

export default function Home() {    
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">      
      <main className="container flex min-h-screen w-full flex-col items-center justify-between bg-white px-6 md:px-16 py-32 dark:bg-black sm:items-start">
        <div>
          <p className="text-sm">
            Are you sure you're meant to be here?
          </p>
          <div className="flex justify-center h-[200px] mt-5 text-xl">
            4&nbsp;<CircleOff />&nbsp;4
          </div>
        </div>
      </main>
    </div>
  );
}
