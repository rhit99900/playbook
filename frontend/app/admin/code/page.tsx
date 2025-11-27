import FilesList from "@/components/application/indexed-files-list";
import EmbedRepoForm from "@/components/application/embed-repo-form";

const Files = () => {
  return (    
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 font-sans dark:bg-black">      
      <main className="container flex min-h-screen w-full flex-col items-center justify-between px-4 md:px-16 py-32 dark:bg-black sm:items-start">        
        <div className="w-full space-y-6">
          <EmbedRepoForm />          
        </div>
      </main>
    </div>
  );  
}

export default Files;
