import DocumentService from "../../model/documents";
import { getEmbeddings } from "../../model/embeddings.model";
import { updateCollections } from "../../utils/chroma.utils";
import { chunkText } from "../../utils/chunk.utils";
import { FileDetails, getDocumentContent } from "../../utils/drive.utils"

class DocumentProcessor {
  constructor() {}

  public process = async (auth: any, file: FileDetails) => {

    await DocumentService.createDocument(file);
    const document = await getDocumentContent(auth, file.id!);    

    if(document) {
      const chunks = chunkText(document);
      const embeddings = await getEmbeddings(chunks);
      await updateCollections(chunks, file, embeddings);
      const result = await DocumentService.updateDocument(file, {
        content: document,
        is_embedded: true,
        file_url: file.webViewLink
      });
      console.log(result);
    }
  } 
}

export default DocumentProcessor;
