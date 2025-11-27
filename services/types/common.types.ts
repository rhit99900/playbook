export type FileSearchFilters = {
  skip?: number,
  limit?: number,
  id?: number,
  file_id?: string,
  file_ids?: string[],
  search?: string
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

export type UsersParams = {
  email: string;
  username: string;
  id: number;
  created_at: Date;
}

export type UsersList = {
  users: UsersParams[],
  count: number;
}

export type GitlabIndexRequest = {
  projectId: string;
  token?: string;
  branch?: string;
  baseUrl?: string;
  includeExtensions?: string[];
  maxFiles?: number;
}
