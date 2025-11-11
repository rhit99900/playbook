"use client";

import { deleteFile, deleteFiles, fetchFiles } from "@/lib/apis";
import { MouseEvent, useEffect, useMemo, useRef, useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from "../ui/pagination";
import { FileDetailsType } from "@/lib/common.types";
import Link from "next/link";
import { Item, ItemActions, ItemContent } from "../ui/item";
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
  const [ selectedFiles, setSelectedFiles ] = useState<Set<string>>(new Set());
  const [ bulkDeleting, setBulkDeleting ] = useState<boolean>(false);
  const selectAllRef = useRef<HTMLInputElement | null>(null);

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
    setSelectedFiles(new Set());
    setSkip(0);
    fetchFileList(0, limit, session.token);
  }

  const nextPage = () => {
    const _skip = skip + limit;    
    setSkip(_skip);
    fetchFileList(_skip, limit, session?.token!);
  }

  const prevPage = () => {
    const _skip = Math.max(skip - limit,0);
    setSkip(_skip);
    fetchFileList(_skip, limit, session?.token!);
  }

  const handlePrevClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    prevPage();
  }

  const handleNextClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    nextPage();
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
      setSelectedFiles((prev) => {
        const next = new Set(prev);
        next.delete(fileId);
        return next;
      });
      refreshFiles();
    } catch(error) {
      setDeleteError('Failed to delete the requested file.');
    } finally {
      setDeletingFileId(null);
    }
  }

  const toggleFileSelection = (fileId: string) => {
    setSelectedFiles((prev) => {
      const next = new Set(prev);
      if(next.has(fileId)) {
        next.delete(fileId);
      } else {
        next.add(fileId);
      }
      return next;
    });
  }

  const visibleFileIds = useMemo(() => files.map((file) => file.file_id), [files]);
  const allSelected = files.length > 0 && visibleFileIds.every((id) => selectedFiles.has(id));
  const hasSelection = selectedFiles.size > 0;

  const toggleSelectAll = () => {
    setSelectedFiles((prev) => {
      if(allSelected) {
        return new Set();
      }
      const next = new Set(prev);
      visibleFileIds.forEach((id) => next.add(id));
      return next;
    });
  }

  const handleBulkDelete = async () => {
    if(!session?.token || !selectedFiles.size) return;
    const confirmed = window.confirm(`Delete ${selectedFiles.size} file(s) and their embeddings?`);
    if(!confirmed) return;
    setBulkDeleting(true);
    setDeleteError(null);
    try {
      await deleteFiles(Array.from(selectedFiles), session.token);
      setSelectedFiles(new Set());
      refreshFiles();
    } catch(error) {
      setDeleteError('Failed to delete the selected files.');
    } finally {
      setBulkDeleting(false);
    }
  }

  useEffect(() => {
    setSelectedFiles((prev) => {
      const next = new Set<string>();
      files.forEach((file) => {
        if(prev.has(file.file_id)) {
          next.add(file.file_id);
        }
      });
      return next;
    });
  }, [files]);

  useEffect(() => {
    if(selectAllRef.current) {
      selectAllRef.current.indeterminate = selectedFiles.size > 0 && !allSelected;
    }
  }, [selectedFiles, allSelected]);

  return (
    <div className="container mx-auto flex flex-col gap-6">
      <EmbedFilesForm token={session?.token} onSuccess={refreshFiles} />
      <div className="overflow-hidden rounded-md">
        {deleteError && <p className="mb-3 text-sm text-destructive">{deleteError}</p>}
        {files && files.length ? (
          <div className="flex flex-col gap-1">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-3 rounded-md border border-border/70 bg-background/60 px-3 py-2">
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input
                ref={selectAllRef}
                type="checkbox"
                className="size-4 rounded border-muted-foreground accent-primary"
                checked={allSelected}
                onChange={toggleSelectAll}
                aria-label="Select all visible files"
              />
              Select all
            </label>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={!hasSelection || bulkDeleting}
            >
              {bulkDeleting ? 'Deleting...' : hasSelection ? `Delete ${selectedFiles.size} selected` : 'Delete selected'}
            </Button>
          </div>
          {files.map((file: FileDetailsType) => {
            return (
              <Item variant={'outline'} key={file.file_id} className="flex flex-wrap items-center gap-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    className="size-4 rounded border-muted-foreground accent-primary"
                    checked={selectedFiles.has(file.file_id)}
                    onChange={() => toggleFileSelection(file.file_id)}
                    aria-label={`Select ${file.title}`}
                  />
                </div>
                <ItemContent className="min-w-[200px] flex-1">
                  <Link href={file.file_url || '#'} target="_blank">
                    <p>{file.title}</p>
                    <p className="text-xs italic">{file.file_id}</p>
                  </Link>
                </ItemContent>
                <ItemContent className="w-20 text-sm">
                  {file.is_embedded === true ? 'Yes' : 'No'}
                </ItemContent>
                <ItemContent className="w-36 text-sm">
                  {formatDate(file.created_at.toString())}
                </ItemContent>
                <ItemActions className="ml-auto">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-destructive"
                    disabled={deletingFileId === file.file_id}
                    onClick={() => handleDelete(file.file_id, file.title)}
                  >
                    {deletingFileId === file.file_id ? (
                      <Ellipsis className="animate-pulse" />
                    ) : (
                      <Trash2Icon />
                    )}
                  </Button>
                </ItemActions>
              </Item>
            )
          })}
            <div>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious href="#" onClick={handlePrevClick}/>
                  </PaginationItem>
                  <PaginationItem>
                    <p className="text-xs">
                      {skip + limit} of {pageCount}
                    </p>
                  </PaginationItem>
                  <PaginationItem>
                    <PaginationNext href="#" onClick={handleNextClick}/>
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
