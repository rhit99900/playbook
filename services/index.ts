import App from './server';
import Builder from './builder';

const main = async () => {
  const builder = new Builder();
  // await builder.process();
}

main();

try {
  const app = new App();
  app.listen();
} catch(e) {
  console.error('Application failed to start!. Please check the code for errors and run again.');
}
