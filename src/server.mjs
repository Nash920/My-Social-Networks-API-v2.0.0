// Dependencies
import express from 'express';
import bodyParser from 'body-parser';

// Core
import routes from './controllers/routes.mjs';

const Server = class Server {
  constructor() {
    this.app = express();
  }

  middleware() {
    this.app.use(bodyParser.urlencoded({
      extended: true
    }));
    this.app.use(bodyParser.json());
  }

  routes() {
    new routes.Users(this.app);

    this.app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: 'Not Found'
      });
    });
  }

  run() {
    this.routes();
    this.app.listen(3000);
  }
};

export default Server;