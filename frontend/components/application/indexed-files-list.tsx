"use client";

import { fetchFiles } from "@/lib/apis";
import { useEffect, useState } from "react";
import { Pagination, PaginationContent, PaginationItem, PaginationPrevious } from "../ui/pagination";
import { FileDetailsType } from "@/lib/common.types";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "../ui/table";
import Link from "next/link";

const FilesList = () => {

  const [ files, setFiles ] = useState<FileDetailsType[]>([]);
  const [ skip, setSkip ] = useState<number>(0);
  const [ limit, setLimit ] = useState<number>(10);

  useEffect(() => {
    fetchFileList(skip, limit);
  }, [])

  const fetchFileList = async (skip: number, limit: number) => {
    const files = await fetchFiles(skip, limit);
    console.log(files);
    setFiles(files.data);
  }

  return (
    <div className="overflow-hidden rounded-md-border">
      {files && files.length ? (
        <Table className="w-full relative">
          <TableCaption>List of Files Indexed & Embdedded.</TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>File Name/Title</TableHead>
              <TableHead>Google Drive File ID</TableHead>
              <TableHead>Is Embedded</TableHead>
            </TableRow>            
          </TableHeader>
          <TableBody>
            {
              files.map((file: FileDetailsType) => {
                return (
                  <TableRow key={file.file_id}>
                    <TableCell>{file.id}</TableCell>
                    <TableCell>{file.title}</TableCell>
                    <TableCell>{file.file_uri ? (
                        <Link href={file.file_uri}>{file.file_id}</Link>
                      ): 
                      file.file_id
                    }
                    </TableCell>
                    <TableCell>{file.is_embedded}</TableCell>
                  </TableRow>
                )
              })
            }
          </TableBody>
        </Table>
      ): null}      
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            <PaginationPrevious href="#"/>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </div>
  )
}

export default FilesList;