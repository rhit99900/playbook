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

  public process = async () => {
    await this.authenticate();
    if(this.is_drive_authenticated) {
      try {      
        const files = await listFiles(this.auth);
        if(files) {
          await this.createFileEmbeddings(files);
        }
      } catch(e: unknown) {
        // @ts-ignore
        console.error(`This doesn't seem to be working!`, e?.message);
      }
    } else {
      console.log(`Google Drive Service Account isn't authenticated correctly. Please check the configuration.`);      
    }
  }

  private createFileEmbeddings = async (files: FileDetails[] | undefined) => {
    const promises = [];
    if(!files) throw new Error('No files to process');
    for(const file of files) {
      promises.push(this.processDocument(file));
    }

    Promise.allSettled(promises).then(() => {
      console.log('Documents Processed')
    }).catch((e: any) => {
      console.info(`Error processing documents`);
    })
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