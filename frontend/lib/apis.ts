import axios from 'axios';
import { API_BASE_URI } from './config';
import { APIResponse, FileDetailsType, AuthApiResponse, AuthSession, LoginPayload, RegisterPayload, AuthUser } from './common.types';

export const fetchFiles = async (skip: number, limit: number):Promise<APIResponse<FileDetailsType[]>> => {
  const url = new URL(`files?skip=${skip}&limit=${limit}`,API_BASE_URI).href;
  const data = await axios({
    method: 'get',
    url: url
  });
  return data.data;
}

export const buildResponderStreamUrl = (query: string) => {
  const url = new URL('respond', API_BASE_URI);
  url.searchParams.set('query', query);
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
    const url = new URL('/auth/register', API_BASE_URI).href;
    const { data } = await axios.post<AuthApiResponse>(url, payload, {
      headers: token
        ? {
            Authorization: `Bearer ${token}`
          }
        : undefined
    });
    return mapAuthResponse(data);
  } catch(e) {
    throw new Error('Failed to register a new user');
  }
};

export const loginUser = async (payload: LoginPayload): Promise<AuthSession> => {
  const url = new URL('/auth/login', API_BASE_URI).href;
  const { data } = await axios.post<AuthApiResponse>(url, payload);
  return mapAuthResponse(data);
};

export const getUsers = async (token?: string, filters?: any):Promise<APIResponse<AuthUser[]>> => {
  try {
    const url = new URL('users', API_BASE_URI).href;
    const { data } = await axios.get(url, {
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
    const { data } = await axios.delete(url, {
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