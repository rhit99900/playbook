import express from 'express';
import type { Request, Response } from 'express';
import cors from 'cors';
import { PORT } from '../config';
import PlaybookRoutes from './routes/index.route';
import morgan from 'morgan';

class App {

  private app: express.Application;
  private env: string = 'development';
  private port: number;

  constructor() {
    this.app = express();
    this.port = PORT;
    this.initiliseMiddlewares();
    this.iniliaseRoutes();
  }

  private initiliseMiddlewares = () => {
    this.app.use(express.json({ limit: '1mb' }));
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cors({
      origin: "*",
      methods: ['GET','POST'],
      credentials: true
    }));
    this.app.use(morgan('common', {
      skip: (req: Request, res: Response) => {
        return [200,400,500].includes(res.statusCode)
      }
    }));
  }

  private iniliaseRoutes = () => {
    const routes = new PlaybookRoutes();
    this.app.use('/', routes.router);
    this.app.get('/health', (req: Request, res: Response) => {
      res.status(200).send({
        message: 'Something'
      })
    })
  }

  public listen = () => {
    this.app.listen(this.port, () => {
      console.log(`Playbook Server Running on PORT ${this.port} (ENV: ${this.env!})`);
    })
  }
}

export default App;


