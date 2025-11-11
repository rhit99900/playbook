import { GOOGLE_DRIVE_CREDENTIALS } from '../config';
import { drive_v3, google } from 'googleapis';
import pdfParse from 'pdf-parse';

const SCOPES = [
  'https://www.googleapis.com/auth/documents.readonly',
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/spreadsheets.readonly',
  'https://www.googleapis.com/auth/presentations.readonly'
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

type ListFileOptions = {
  pageSize?: number;
  fileIds?: string[];
};

const DEFAULT_PAGE_SIZE = 100;

export const listFiles = async (auth: any, options?: ListFileOptions):Promise<FileDetails[] | undefined> => {
  if(options?.fileIds && options.fileIds.length) {
    return getFilesByIds(auth, options.fileIds);
  }
  return listAllFiles(auth, options?.pageSize);
}

export const listAllFiles = async (auth: any, pageSize: number = DEFAULT_PAGE_SIZE):Promise<FileDetails[] | undefined> => {
  try {
    const drive = google.drive({ version: 'v3', auth});
    const files: FileDetails[] = [];
    let nextPageToken: string | undefined = undefined;
    do {
      const res:any = await drive.files.list({
        pageSize,
        pageToken: nextPageToken,
        fields: `nextPageToken, files(id, name, mimeType, parents, webViewLink)`
      });
      if(res.data.files) {
        files.push(...res.data.files);
      }
      nextPageToken = res.data.nextPageToken || undefined;
    } while(nextPageToken);
    return files;
  } catch(e) {
    console.error('Failed to list google drive files', e);
  }
}

export const getFilesByIds = async (auth: any, fileIds: string[]):Promise<FileDetails[] | undefined> => {
  if(!fileIds || !fileIds.length) return [];
  try {
    const drive = google.drive({ version: 'v3', auth});
    const requests = fileIds.map((id) => drive.files.get({
      fileId: id,
      fields: 'id, name, mimeType, parents, webViewLink'
    }).then(resp => resp.data).catch((error) => {
      console.error(`Failed to fetch file ${id} metadata`, error?.message || error);
      return undefined;
    }));
    const results = await Promise.all(requests);
    return results.filter((file): file is FileDetails => Boolean(file));
  } catch(e) {
    console.error('Failed to fetch google drive files by ids', e);
  }
}

export const getDocumentContent = async (auth: any, id: string) => {
  const drive = google.drive({ version: 'v3', auth});

  try {
    const metadata = await drive.files.get({
      fileId: id,
      fields: 'id, name, mimeType'
    });

    const mimeType = metadata.data.mimeType;

    if(!mimeType) {
      console.warn(`Unable to determine mimeType for file ${id}, skipping content extraction`);
      return;
    }

    switch (mimeType) {
      case 'application/vnd.google-apps.document':
        return await getGoogleDocContent(auth, id);
      case 'application/vnd.google-apps.spreadsheet':
        // return await getGoogleSheetContent(auth, id);
        return false;
      case 'application/vnd.google-apps.presentation':
        return await getGoogleSlideContent(auth, id);
      case 'application/pdf':
        // return await getPdfContent(auth, id);
        return false;
      default:
        return false;
        // return await exportPlainText(drive, id);
    }
  } catch(e) {
    // @ts-ignore
    console.error('Failed to retrieve file metadata from Google Drive', e?.message);
  }
}

const getGoogleDocContent = async (auth: any, id: string) => {
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

const getGoogleSheetContent = async (auth: any, id: string) => {
  try {
    const sheets = google.sheets({ version: 'v4', auth });
    const response = await sheets.spreadsheets.get({
      spreadsheetId: id,
      includeGridData: true
    });

    const segments: string[] = [];

    response.data.sheets?.forEach(sheet => {
      if(sheet?.properties?.title) {
        segments.push(`# ${sheet.properties.title}`);
      }

      sheet?.data?.forEach(data => {
        data.rowData?.forEach(row => {
          const rowValues = row.values?.map(cell => cell.formattedValue ?? '').filter(Boolean);
          if(rowValues && rowValues.length) {
            segments.push(rowValues.join('\t'));
          }
        });
      });

      segments.push('');
    });

    const content = segments.join('\n').trim();
    return content ? content : undefined;
  } catch(e) {
    // @ts-ignore
    console.error('Failed to retrieve content out of Google Sheet API', e?.message);
  }
}

const getGoogleSlideContent = async (auth: any, id: string) => {
  try {
    const slides = google.slides({ version: 'v1', auth });
    const response = await slides.presentations.get({
      presentationId: id
    });

    const segments: string[] = [];

    response.data.slides?.forEach(slide => {
      slide.pageElements?.forEach(element => {
        element.shape?.text?.textElements?.forEach(textElement => {
          const content = textElement.textRun?.content;
          if(content) {
            segments.push(content.trim());
          }
        });
      });
      segments.push('');
    });

    const content = segments.join('\n').trim();
    return content ? content : undefined;
  } catch(e) {
    // @ts-ignore
    console.error('Failed to retrieve content out of Google Slides API', e?.message);
  }
}

const getPdfContent = async (auth: any, id: string) => {
  try {
    const drive = google.drive({ version: 'v3', auth });
    const response = await drive.files.get(
      {
        fileId: id,
        alt: 'media'
      },
      {
        responseType: 'arraybuffer'
      }
    );

    const data = response.data as ArrayBuffer;
    const buffer = Buffer.from(data);
    const parsed = await pdfParse(buffer);
    return parsed.text.trim();
  } catch(e) {
    // @ts-ignore
    console.error('Failed to retrieve content out of PDF file', e?.message);
  }
}

const exportPlainText = async (drive: drive_v3.Drive, id: string) => {
  try {
    const response = await drive.files.export(
      {
        fileId: id,
        mimeType: 'text/plain'
      },
      {
        responseType: 'arraybuffer'
      }
    );
    const data = response.data as ArrayBuffer;
    return Buffer.from(data).toString('utf-8').trim();
  } catch(e) {
    // @ts-ignore
    console.error(`Unable to export file ${id} as plain text`, e?.message);
  }
}
