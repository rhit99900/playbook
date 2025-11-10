export type FileSearchFilters = {
  skip?: number,
  limit?: number,
  id?: number,
  file_id?: number
}

export type FilesParams = {
  id: number;
  created_at: Date;
  title: string;
  content: string | null;
  file_id: string | null;
  file_url: string | null;
  is_embedded: boolean;
}

export type FileListingResponse = {
  files: FilesParams[] | [],
  count: number;
}