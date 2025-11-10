import { FileListingResponse, FileSearchFilters } from "../types/common.types";
import { FileDetails } from "../utils/drive.utils";
import Prisma from "../utils/prisma.utils";

class Documents {

  public createDocument = async (file: FileDetails):Promise<any> => {
    if(!file.id) return;
    try {
      const document = await Prisma.files.upsert({
        where: {
          file_id: file.id
        },
        update: {
          title: file.name || 'Untitled',
          file_url: file.webViewLink || ''
        },
        create: {
          file_id: file.id,
          file_url: file.webViewLink || '',
          title: file.name || 'Untitled',
          content: '',
          is_embedded: false
        }
      });
      return document;
    } catch(e) {
      console.error(`Failed to create file entry for embedding`);
    }
  }

  public updateDocument = async(file: FileDetails, data: any):Promise<any> => {
    if(!file.id) return;
    try {
      const document = await Prisma.files.upsert({
        where: {
          file_id: file.id
        },
        update: {
          is_embedded: data.is_embedded ?? false,
          file_url: data.file_url || file.webViewLink || '',
          title: file.name || 'Untitled',
          content: data.content || ''
        },
        create: {
          file_id: file.id,
          file_url: data.file_url || file.webViewLink || '',
          title: file.name || 'Untitled',
          content: data.content || '',
          is_embedded: data.is_embedded ?? false
        }
      });
      return document;
    } catch(e) {
      console.error(`Failed to update document metadata for file ${file.id}`);
    }
  }

  public getFiles = async (filter: FileSearchFilters):Promise<FileListingResponse> => {
    try {
      const files = await Prisma.files.findMany({
        skip: filter.skip || 0,
        take: filter.limit || 10                
      });
      const count = await Prisma.files.count();
      return {
        files: files,
        count: count
      };
    } catch(e) {
      console.log('Failed to fetch files');
      throw new Error('Failed to fetch files');
    }
  }

  public deleteFiles = async (filter: FileSearchFilters) => {
    try {
      const filters: Record<string,any> = {};
      if(filter.file_id) filters['file_id'] = filter.file_id;
      if(filter.id) filters['file_id'] = filter.id;      
      const files = await Prisma.files.deleteMany({
        where: filters
      });
      return files;
    } catch(e) {
      console.error(`ERROR: Failed to delete files for filter ${JSON.stringify(filter)}`);
    }
  }

  public isDocumentEmbedded = async (fileId: string | undefined):Promise<boolean> => {
    if(!fileId) return false;
    try {
      const document = await Prisma.files.findUnique({
        where: {
          file_id: fileId
        },
        select: {
          is_embedded: true
        }
      });
      return Boolean(document?.is_embedded);
    } catch(e) {
      console.error(`Failed to check embedding status for file ${fileId}`);
      return false;
    }
  }
}

const DocumentService = new Documents();
export default DocumentService;
