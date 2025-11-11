import App from './server';
import Builder from './builder';

const main = async () => {
  const builder = new Builder();
  // Enable this you want to trigger the embdeeding as soon as the service is up and running
  // await builder.process();
}

main();

try {
  const app = new App();
  app.listen();
} catch(e) {
  console.error('Application failed to start!. Please check the code for errors and run again.');
}
