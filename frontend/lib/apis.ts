import axios from 'axios';
import { API_BASE_URI } from './config';
import { APIResponse, FileDetailsType, AuthApiResponse, AuthSession, LoginPayload, RegisterPayload } from './common.types';

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

export const registerUser = async (
  payload: RegisterPayload,
  authToken?: string
): Promise<AuthSession> => {
  const url = new URL('/auth/register', API_BASE_URI).href;
  const { data } = await axios.post<AuthApiResponse>(url, payload, {
    headers: authToken
      ? {
          Authorization: `Bearer ${authToken}`
        }
      : undefined
  });
  return mapAuthResponse(data);
};

export const loginUser = async (payload: LoginPayload): Promise<AuthSession> => {
  const url = new URL('/auth/login', API_BASE_URI).href;
  const { data } = await axios.post<AuthApiResponse>(url, payload);
  return mapAuthResponse(data);
};

export const getUsers = async (filters?: any) => {
  try {
    const url = new URL('users', API_BASE_URI).href;
    const { data } = await axios.get(url);
    if(data.success) {
      return data.users
    } else {
      throw new Error('Failed to fetch users information');
    }
  } catch(e) {
    throw new Error('Failed to fetch user details');
  }
}