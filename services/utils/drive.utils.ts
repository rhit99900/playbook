import fs from 'fs';
import { GOOGLE_DRIVE_CREDENTIALS, TOKEN_PATH } from '../config';
import { drive_v3, google } from 'googleapis';
import { JWT } from 'google-auth-library';

const SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive'
];


export type FileDetails = drive_v3.Schema$File;

const loadSavedCredentials = () => {
  try {    
    const auth = new google.auth.GoogleAuth({
      credentials: GOOGLE_DRIVE_CREDENTIALS,
      scopes: SCOPES
    });
    return auth;    
  } catch(e) {
    console.error('Failed to authenticate with google servers', e);
  }
}

export const authorise = () => {
  let client = loadSavedCredentials();
  return client;
}

export const listFiles = async (auth: any):Promise<FileDetails[] | undefined> => {
  try {
    const drive = google.drive({ version: 'v3', auth});
    const res = await drive.files.list({
      pageSize: 10,
      fields: `files(id, name, mimeType, parents)`
    });
    return res.data.files;
  } catch(e) {
    console.error('Failed to authenticate with google drive', e);
  }
}

export const getDocumentContent = async (auth: any, id: string) => {
  try {
    const docs = google.docs({version: 'v1', auth: auth});
    const response = await docs.documents.get({
      documentId: id
    });
    let content = '';
    if(response.data.body && response.data.body.content) {
      for(const element of response.data.body.content) {
        if(element.paragraph && element.paragraph.elements) {
          for(const text of element.paragraph.elements) {
            if(text.textRun && text.textRun.content) {
              content += text.textRun.content;              
            }
          }
        }
      }
    }
    return content.trim();
  } catch(e) {
    // @ts-ignore
    console.error('Failed to retrive content out of Google Doc API', e?.message);
  }
}
