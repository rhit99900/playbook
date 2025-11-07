import { FileSearchFilters } from "../types/common.types";
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

  public getFiles = async (filter: FileSearchFilters) => {
    try {
      const files = await Prisma.files.findMany({
        skip: filter.skip || 0,
        take: filter.limit || 10                
      });
      return files;
    } catch(e) {
      console.log('Failed to fetch files');
      return false;
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
}

const DocumentService = new Documents();
export default DocumentService;
