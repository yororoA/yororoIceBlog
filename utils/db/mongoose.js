const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

const uri = process.env.MONGO_URI;

mongoose.set('strictQuery', true);

let isConnected = false;

async function connectMongo() {
  if (isConnected) return mongoose.connection;
  await mongoose.connect(uri, {
    // keepAlive: true is default in modern drivers
    serverSelectionTimeoutMS: 5000,
  });
  isConnected = true;
  return mongoose.connection;
}

module.exports = { mongoose, connectMongo };
