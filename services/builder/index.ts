import { initialiseChromaDB } from "../utils/chroma.utils";
import { authorise, FileDetails, listFiles } from "../utils/drive.utils";
import DocumentProcessor from "./processors/document.processor";

class Builder {

  private auth: any;
  private is_drive_authenticated: boolean = false;

  constructor() {   
    console.info(' --- Builder Initialised --- ');
    this.initiliaseChroma().then(() => {
      console.info('ChromaDB Initialised');
    }).catch((e: any) => {
      console.error('Failed to initialise ChromaDB. Please check if the services are up and running');
    });
  }

  private authenticate = async ():Promise<void> => {
    try {
      this.auth = await authorise();
      this.is_drive_authenticated = true;
    } catch(e) {
      console.error('Failed to authenticate with google drive Service Account');
    }
  }

  private initiliaseChroma = async ():Promise<void> => {
    await initialiseChromaDB();
  }

  public process = async (fileIds?: string[]) => {
    await this.initiliaseChroma();
    await this.authenticate();
    if(!this.is_drive_authenticated) {
      console.log(`Google Drive Service Account isn't authenticated correctly. Please check the configuration.`);
      return;
    }

    try {
      const files = await listFiles(this.auth, {
        fileIds: fileIds && fileIds.length ? fileIds : undefined
      });
      if(!files || !files.length) {
        console.warn('No files returned from Google Drive for processing');
        return;
      }
      await this.createFileEmbeddings(files);
    } catch(e: unknown) {
      // @ts-ignore
      console.error(`Failed to process documents`, e?.message);
      throw e;
    }
  }

  private createFileEmbeddings = async (files: FileDetails[]) => {
    if(!files.length) {
      console.warn('No files to process');
      return;
    }

    const jobs = files
      .filter((file) => Boolean(file?.id))
      .map((file) => this.processDocument(file));

    await Promise.allSettled(jobs);
    console.log('Documents Processed');
  }

  private processDocument = async (file: FileDetails) => {    
    try {    
      const processor = new DocumentProcessor();
      await processor.process(this.auth, file);
    } catch(e) {
      console.error('Failed to process Document');
    }
  }

}

export default Builder;
