import { authorise, getDocumentContent, listFiles } from './utils/drive.utils';
import { getEmbeddings } from './model/embeddings.model';
import { initialiseChromaDB, updateCollections } from './utils/chroma.utils';
import { chunkText } from './utils/chunk.utils';
import readline from 'readline-sync';
import { Responder } from './model/responder';

// If modifying these scopes, delete token.json.
const main = async () => {
  console.log(`Starting ChatBot...`);  
  await initialiseChromaDB();

  try {
    const auth = await authorise();
    const files = await listFiles(auth);
    if(files) {
      for(const file of files) {
        if(file.id && file.mimeType === 'application/vnd.google-apps.document') {
          const document = await getDocumentContent(auth, file.id);
          if(document) {
            console.log(`\n -- Document ${file.name} Loaded --`);
            console.log(`---- ${document?.length} Characters Found ----`);
            const chunks = chunkText(document);
            console.log(chunks);
            // const embeddings = await getEmbeddings(chunks);            
            // await updateCollections(chunks, file, embeddings);
          } else {

          }
        }
      }
    }

    while(true) {
      const query = readline.question('You: ');
            
      if(query.toLowerCase() === 'exit') {
        console.log('GoodBye')
        break;
      }

      const answer = await Responder(query);
      console.log(`Bot: ${answer}`);
    }
  } catch(e) {
    console.error(`This doesn't seem to be working.`, e);
  }
}

main();