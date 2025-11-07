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
