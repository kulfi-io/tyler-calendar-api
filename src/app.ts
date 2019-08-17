import * as bodyParser from 'body-parser';
import {name, port, host} from './config/config.json';
import * as cors from 'cors';
import * as express from 'express';
import * as helmet from 'helmet';
import * as logger from 'morgan';
import routes from './routes';
import * as moment from 'moment';

export class App {
  private server: express.Application;

  constructor() {
    this.server = express();
    this.configureMiddleware();
    this.routes();

    this.run();
  }

  private configureMiddleware() {
    this.server.use(logger('dev'));
    this.server.use(bodyParser.urlencoded({ extended: false }));
    this.server.use(bodyParser.json());
    this.server.use(helmet());
    this.server.disable('x-powered-by');
    this.server.all('/*', cors());

    // this.server.all('/v1/*', ValidateRequest.validate);
  }

  private routes() {
    const router = express.Router();
    router.get('/', (req, res) => {
      res.status(200).send('welcome');
    });
    routes.map(router);
    this.server.use(router);
  }

  public run() {
    process.title = name;
    this.server.listen(port, host, () => {
      console.log(`${name} listening on: ${host}:${port}`);
      console.log(`ENV: ${process.env.NODE_ENV}`);
      console.log('firstday', moment(1, 'DD').toISOString());
    });
  }
}

export default new App();