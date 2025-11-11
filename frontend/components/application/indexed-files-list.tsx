"use client";

import { deleteFile, fetchFiles } from "@/lib/apis";
import { useEffect, useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "../ui/pagination";
import { FileDetailsType } from "@/lib/common.types";
import Link from "next/link";
import { Item, ItemContent } from "../ui/item";
import EmptyResults from "./empty";
import { useAppDispatch, useAppSelector } from "@/utils/state/hooks";
import { RootState } from "@/utils/state/store";
import { readAuthSession } from "@/utils/auth-storage";
import { setCredentials, setUserAuthState } from "@/utils/slices/auth";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/utils";
import EmbedFilesForm from "./embed-files-form";
import { Button } from "../ui/button";
import { Ellipsis, Trash2Icon } from "lucide-react";

const FilesList = () => {

  const [ files, setFiles ] = useState<FileDetailsType[]>([]);
  const [ skip, setSkip ] = useState<number>(0);
  const [ limit, setLimit ] = useState<number>(10);
  const [ pageCount, setPageCount ] = useState<number>(0);
  const [ deletingFileId, setDeletingFileId ] = useState<string | null>(null);
  const [ deleteError, setDeleteError ] = useState<string | null>(null);

  const dispatch = useAppDispatch();
  const router = useRouter();
  const session = useAppSelector((state: RootState) => state.auth.session);
  const authState = useAppSelector((state: RootState) => state.auth.authState);

  useEffect(() => {
    if (!session) {
      const stored = readAuthSession();
      if (stored) {
        dispatch(setCredentials(stored));
      }
    }
  }, [session, dispatch]);

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

  useEffect(() => {
    if(authState === 'authorized' && session?.token) {
      fetchFileList(skip, limit, session.token);
    }
  }, [authState, session])

  const fetchFileList = async (skip: number, limit: number, token: string) => {
    const files = await fetchFiles(skip, limit, token);
    setFiles(files.data);
    if(files.count) {
      setPageCount(files.count);
    }
  }

  const refreshFiles = () => {
    if(!session?.token) return;
    setSkip(0);
    fetchFileList(0, limit, session.token);
  }

  const nextPage = () => {
    const _skip = skip + limit;    
    setSkip(_skip);
    fetchFileList(_skip, limit, session?.token!);
  }

  const handleDelete = async (fileId: string, title: string) => {
    if(!session?.token) return;
    // Change this to a custom popup
    const confirmed = window.confirm(`Delete \"${title}\" and remove its embeddings?`);
    if(!confirmed) return;
    setDeletingFileId(fileId);
    setDeleteError(null);
    try {
      await deleteFile(fileId, session.token);
      refreshFiles();
    } catch(error) {
      setDeleteError('Failed to delete the requested file.');
    } finally {
      setDeletingFileId(null);
    }
  }

  return (
    <div className="container mx-auto flex flex-col gap-6">
      <EmbedFilesForm token={session?.token} onSuccess={refreshFiles} />
      <div className="overflow-hidden rounded-md">
        {deleteError && <p className="mb-3 text-sm text-destructive">{deleteError}</p>}
        {files && files.length ? (
          <div className="flex flex-col gap-1">
          {files.map((file: FileDetailsType) => {
            return (
              <Item variant={'outline'} key={file.file_id} className="flex flex-row">
                <ItemContent>
                  <Link href={file.file_url || '#'}>
                    <p>{file.title}</p>
                    <p className="text-xs italic">{file.file_id}</p>
                  </Link>
                </ItemContent>
                <ItemContent>{file.is_embedded === true ? 'Yes' : 'No'}</ItemContent>
                <ItemContent>{formatDate(file.created_at.toString())}</ItemContent>
                <ItemContent className="flex justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    disabled={deletingFileId === file.file_id}
                    onClick={() => handleDelete(file.file_id, file.title)}
                  >
                    {deletingFileId === file.file_id ? (
                      <Ellipsis />
                    ) : (
                      <Trash2Icon />
                    )}
                  </Button>
                </ItemContent>
              </Item>
            )
          })}
            <div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#"/>
                  </PaginationItem>
                  <PaginationItem>
                    <p className="text-xs">
                      {skip + limit} of {pageCount}
                    </p>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={() => nextPage()}/>
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
          </div>
          </div>        
        ): (
          <EmptyResults title="No Embdedded Files" />
        )}      
      </div>
    </div>
  )
}

export default FilesList;
