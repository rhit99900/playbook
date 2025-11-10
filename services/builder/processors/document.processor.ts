import DocumentService from "../../model/documents";
import { getEmbeddings } from "../../model/embeddings.model";
import { updateCollections } from "../../utils/chroma.utils";
import { chunkText } from "../../utils/chunk.utils";
import { FileDetails, getDocumentContent } from "../../utils/drive.utils"

class DocumentProcessor {
  constructor() {}

  public process = async (auth: any, file: FileDetails) => {
    
    if(await DocumentService.isDocumentEmbedded(file.id!)) {
      console.info(`Skipping embedding for ${file.name || file.id} - already embedded`);
      return;
    }

    const document = await getDocumentContent(auth, file.id!);    
    if(document) {
      await DocumentService.createDocument(file);
      const chunks = chunkText(document);
      const embeddings = await getEmbeddings(chunks);
      await updateCollections(chunks, file, embeddings);
      const result = await DocumentService.updateDocument(file, {
        content: document.length,
        is_embedded: true,
        file_url: file.webViewLink
      });
      console.log(result);
    }
  } 
}

export default DocumentProcessor;
