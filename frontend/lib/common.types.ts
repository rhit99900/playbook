export type FileDetailsType = {
  id: number;
  file_id: string;
  is_embedded: boolean;
  title: string;
  content?: string;
  file_url?: string;
  created_at: Date
}

export type APIResponse<T> = {
  success: boolean;
  data: T
  count?: number;
}

export type SourceAttribution = {
  documentId?: string | null;
  chunkIndex: number;
  chunk: string;
  distance?: number | null;
};

export type ResponderContextEvent = {
  context: string;
  sources: SourceAttribution[];
};

export type ResponderStatusEvent = {
  message: string;
};

export type ResponderAnswerEvent = {
  answer: string | null;
};

export type AuthUser = {
  id: number;
  email: string;
  username: string;
  created_at: string;
  updated_at: string;
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};

export type DriveFileMetadata = {
  id: string;
  name?: string | null;
  webViewLink?: string | null;
};

export type ChromaStatus = {
  connected: boolean;
  collectionName?: string | null;
  documentCount?: number | null;
};

export type SystemStats = {
  embeddedFiles: number;
  chroma: ChromaStatus;
};

export type AuthApiResponse = {
  success: boolean;
  user: AuthUser;
  token: string;
  message?: string;
};

export type RegisterPayload = {
  email: string;
  username: string;
  password: string;
};

export type LoginPayload = {
  identifier: string;
  password: string;
};


export type NavigationMenuType = {
  title: string;
  href: string;
  description?: string;
}
