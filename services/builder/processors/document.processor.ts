import { content } from "googleapis/build/src/apis/content";
import DocumentService from "../../model/documents";
import { getEmbeddings } from "../../model/embeddings.model";
import { updateCollections } from "../../utils/chroma.utils";
import { chunkText } from "../../utils/chunk.utils";
import { FileDetails, getDocumentContent } from "../../utils/drive.utils"

class DocumentProcessor {
  constructor() {}

  public process = async (auth: any, file: FileDetails) => {

    const _file = await DocumentService.createDocument(file);
    console.log(`File Entry`,_file);
    const document = await getDocumentContent(auth, file.id!);    

    if(document) {
      const chunks = chunkText(document);
      const embeddings = await getEmbeddings(chunks);
      await updateCollections(chunks, file, embeddings);
      const result = await DocumentService.updateDocument(_file, {
        content: document,
        is_embedded: true
      });
      console.log(result);
    }
  } 
}

export default DocumentProcessor;