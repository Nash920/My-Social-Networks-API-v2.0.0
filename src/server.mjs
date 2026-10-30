// Dependencies
import express from 'express';
import bodyParser from 'body-parser';
import mongoose from 'mongoose';

// Core
import routes from './controllers/routes.mjs';

const Server = class Server {
  constructor() {
    this.app = express();
  }

  async dbConnect() {
    const host = 'mongodb+srv://xzen:xzen@studyliquid.vfnnajw.mongodb.net/apidemo';

    this.connect = await mongoose.createConnection(host, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    const close = () => {
      this.connect.close((err) => {
        if (err) {
          console.log(`[CLOSE] api dbConnect() -> close() -> ${err}`);
        } else {
          console.log('[CLOSE] api dbConnect() -> mongodb closed');
        }
      });
    }

    this.connect.on('error', (err) => {
      setTimeout(() => {
        console.log('[ERROR] api dbConnect() -> mongodb server');
        this.connect = this.dbConnect(host);
      }, 5000);

      console.error(`[ERROR] api dbConnect( -> ${err}`);
    });

    this.connect.on('disconnected', (err) => {
      setTimeout(() => {
        console.log('[DISCONNECTED] api dbConnect() -> mongodb server');
        this.connect = this.dbConnect(host);
      }, 5000);

      console.error(`[DISCONNECTED] api dbConnect( -> ${err}`);
    });

    process.on('SIGINT', () => {
      close();
      console.log('[API END PROCESS] api dbConnect() -> close');
      process.exit(0);
    });
  }

  middleware() {
    this.app.use(bodyParser.urlencoded({
      extended: true
    }));
    this.app.use(bodyParser.json());
  }

  routes() {
    new routes.Users(this.app, this.connect);

    this.app.use((req, res) => {
      res.status(404).json({
        code: 404,
        message: 'Not Found'
      });
    });
  }

  async run() {
    try {
      await this.dbConnect();
      this.middleware();
      this.routes();
      this.app.listen(3000);
    } catch (err) {
      console.log(`[ERROR] server ->  ${err}`);
    }
  }
};

export default Server;

















