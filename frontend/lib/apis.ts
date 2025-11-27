import apiClient from '@/utils/api-client';
import { API_BASE_URI } from './config';
import { APIResponse, FileDetailsType, AuthApiResponse, AuthSession, LoginPayload, RegisterPayload, AuthUser, DriveFileMetadata, SystemStats } from './common.types';

export const fetchFiles = async (skip: number, limit: number, token: string, search?: string):Promise<APIResponse<FileDetailsType[]>> => {
  const url = new URL('files', API_BASE_URI);
  
  url.searchParams.set('skip', skip.toString());
  url.searchParams.set('limit', limit.toString());  
  
  if(search && search.trim().length) {
    url.searchParams.set('search', search.trim());
  }
  
  const data = await apiClient.get(url.href, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data.data;
}

export const buildResponderStreamUrl = (query: string, source: 'docs' | 'code' = 'docs') => {
  const url = new URL('respond', API_BASE_URI);
  url.searchParams.set('query', query);
  url.searchParams.set('source', source);
  return url.toString();
}

const mapAuthResponse = (response: AuthApiResponse): AuthSession => {
  if (!response?.success || !response.user || !response.token) {
    throw new Error(response?.message || 'Unable to complete request. Please try again.');
  }
  return {
    user: response.user,
    token: response.token
  };
};

export const registerUser = async (payload: RegisterPayload, token?: string): Promise<AuthSession> => {
  try {
    const url = new URL('auth/register', API_BASE_URI).href;
    const { data } = await apiClient.post<AuthApiResponse>(url, payload, {
      headers: token ? {
          Authorization: `Bearer ${token}`
        } : undefined
    });
    return mapAuthResponse(data);
  } catch(e) {
    throw new Error('Failed to register a new user');
  }
};

export const loginUser = async (payload: LoginPayload): Promise<AuthSession> => {
  const url = new URL('auth/login', API_BASE_URI).href;
  const { data } = await apiClient.post<AuthApiResponse>(url, payload);
  return mapAuthResponse(data);
};

export const getUsers = async (token?: string, filters?: any):Promise<APIResponse<AuthUser[]>> => {
  try {
    const url = new URL('users', API_BASE_URI).href;
    const { data } = await apiClient.get(url, {
      headers: token ? {
        'Authorization': `Bearer ${token}`
      }: undefined
    });
    if(data.success) {
      return data;
    } else {
      throw new Error('Failed to fetch users information');
    }
  } catch(e) {
    throw new Error('Failed to fetch user details');
  }
}

export const deleteUser = async (id: number, token?: string): Promise<boolean> => {
  try {
    const url = new URL(`users/${id.toString()}`, API_BASE_URI).href;
    const { data } = await apiClient.delete(url, {
      headers: token ? {
        Authorization: `Bearer ${token}`
      } : undefined
    });
    if(data.success) {
      return true;
    } else {
      return false;
    }
  } catch(e) {
    throw new Error('Failed to delete users');
  }
}

export const deleteFile = async (fileId: string, token: string): Promise<boolean> => {
  const encodedId = encodeURIComponent(fileId);
  const url = new URL(`files/${encodedId}`, API_BASE_URI).href;
  const { data } = await apiClient.delete<{ success: boolean }>(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data.success;
}

export const deleteFiles = async (fileIds: string[], token: string): Promise<boolean> => {
  if(!fileIds.length) return false;
  const url = new URL('files', API_BASE_URI).href;
  const { data } = await apiClient.delete<{ success: boolean }>(url, {
    headers: {
      Authorization: `Bearer ${token}`
    },
    data: {
      fileIds
    }
  });
  return data.success;
}

export const indexGitlabRepository = async (payload: Record<string, any>, token: string) => {
  const url = new URL('code/index', API_BASE_URI).href;
  const { data } = await apiClient.post(url, payload, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data;
}

export const lookupDriveFile = async (fileId: string, token: string): Promise<DriveFileMetadata> => {
  const encodedId = encodeURIComponent(fileId);
  const url = new URL(`files/lookup/${encodedId}`, API_BASE_URI).href;
  const { data } = await apiClient.get<APIResponse<DriveFileMetadata>>(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data.data;
}

export const indexFilesForEmbedding = async (fileIds: string[], token: string): Promise<{ success: boolean; message?: string; fileIds?: string[] }> => {
  const url = new URL('files/index', API_BASE_URI).href;
  const { data } = await apiClient.post(url, { fileIds }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data;
}

export const fetchSystemStats = async (token: string): Promise<SystemStats> => {
  const url = new URL('stats', API_BASE_URI).href;
  const { data } = await apiClient.get<APIResponse<SystemStats>>(url, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  return data.data;
}
