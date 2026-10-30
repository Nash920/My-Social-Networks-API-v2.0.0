import mongoose from 'mongoose';
const { Schema } = mongoose;

const user = new Schema({
  firstName: String,
  lastName: String,
  email: {
    type: String,
    required: true,
    index: true,
    unique: true
  },
  age: Number,
  city: String
}, {
  collection: 'users',
  minimize: false,
  versionKey: false
}).set('toJSON', {
  transform: (doc, ret) => {
    const retUpdated = ret;

    retUpdated.id = ret._id;

    delete retUpdated._id;

    return retUpdated;
  }
});

export default user;