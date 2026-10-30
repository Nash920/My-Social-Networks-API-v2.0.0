import UserModel from '../models/user.mjs';

const Users = class Users {
 constructor(app, connect) {
  this.app = app;
  this.UserModel = connect.model('User', UserModel);

  this.run();
 }

 create() {
  this.app.post('/user/', (req, res) => {
    try {
      const userModel = new this.UserModel(req.body);

      userModel.save().then((user) => {
        res.status(200).json(user || {});
      }).catch((err) => {
        res.status(400).json({
          code: 400,
          message: err
        });
      });
    } catch {
      res.status(500).json({
        code: 500,
        message: 'Internal Server Error'
      });
    }
  });
 }

 showByid() {
  this.app.get('/user/:id', (req, res) => {
    try {
      const id = req.params.id;

      this.UserModel.findById(id).then((user) => {
        res.status(200).json(user || {});
      }).catch(() => {
        res.status(404).json({
          code: 404,
          message: 'Not Found'
        });
      });
    } catch {
      res.status(500).json({
        code: 500,
        message: 'Internal Server Error'
      });
    }
  });
 }

 getAll() {
  this.app.get('/users/', (req, res) => {
    try {
      this.UserModel.find().then((users) => {
        res.status(200).json(users || []);
      }).catch(() => {
        res.status(404).json({
          code: 404,
          message: 'Not Found'
        });
      });
    } catch {
      res.status(500).json({
        code: 500,
        message: 'Internal Server Error'
      });
    }
  });
 }

 run() {
  this.create();
  this.getAll();
  this.showByid();
 }
};

export default Users;

















