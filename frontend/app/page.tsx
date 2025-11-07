import FilesList from "@/components/application/indexed-files-list";
import PromptInput from "@/components/application/prompt-input";

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex container min-h-screen w-full flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <PromptInput />
        <FilesList />
      </main>
    </div>
  );
}
