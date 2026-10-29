const data = [
  {
    id: '1',
    firstName: 'Cyril',
    age: 35
  },
  {
    id: '2',
    firstName: 'Camille',
    age: 26
  }
];

const Users = class Users {
 constructor(app) {
  this.app = app;

  this.run();
 }

 getShowByid() {
  this.app.get('/users/:id', (req, res) => {
    try {
      const id = req.params.id;
      const user = data.filter((user) => user.id === id);

      res.status(200).json(user[0] || {});
    } catch {
      res.status(500).json({
        code: 500,
        message: 'Internal Server Error'
      });
    }
  });
 }

 getAll() {
  try {
    this.app.get('/users/', (req, res) => {
      res.status(200).json(data);
    });
  } catch (error) {
    res.status(500).json({
      code: 500,
      message: 'Internal Server Error',
      error
    });
  }
 }

 run() {
  this.getAll();
  this.getShowByid();
 }
};

export default Users;