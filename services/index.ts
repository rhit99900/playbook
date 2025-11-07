import { authorise, getDocumentContent, listFiles } from './utils/drive.utils';
import { getEmbeddings } from './model/embeddings.model';
import { initialiseChromaDB, updateCollections } from './utils/chroma.utils';
import { chunkText } from './utils/chunk.utils';
import readline from 'readline-sync';
import Responder from './model/responder';
import App from './server';
import Builder from './builder';

// If modifying these scopes, delete token.json.
const main = async () => {

  const builder = new Builder();
  await builder.process();
}

main();

try {
  const app = new App();
  app.listen();
} catch(e) {
  console.error('Application failed to start!. Please check the code for errors and run again.');
}
