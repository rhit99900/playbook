export type FileDetailsType = {
  id: number;
  file_id: string;
  is_embedded: boolean;
  title: string;
  content?: string;
  file_uri?: string;
}

export type APIResponse<T> = {
  success: boolean;
  data: T
}