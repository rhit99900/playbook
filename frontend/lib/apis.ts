import axios from 'axios';
import { API_BASE_URI } from './config';
import { APIResponse, FileDetailsType } from './common.types';

export const fetchFiles = async (skip: number, limit: number):Promise<APIResponse<FileDetailsType[]>> => {

  const url = new URL(`/files?skip=${skip}&limit=${limit}`,API_BASE_URI).href;

  const data = await axios({
    method: 'get',
    url: url
  });
  return data.data;
}

export const buildResponderStreamUrl = (query: string) => {
  const url = new URL('/respond', API_BASE_URI);
  url.searchParams.set('query', query);
  return url.toString();
}
