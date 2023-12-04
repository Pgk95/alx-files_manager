const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    const host = process.env.DB_HOST || '127.0.0.1';
    const port = process.env.DB_PORT || '27017';
    const database = process.env.DB_DATABASE || 'files_manager';

    const url = `mongodb://${host}:${port}/${database}`;

    this.client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });
    this.client.connect()
      .then(() => {
        console.log(`DBClient connected to ${host}:${port}`);
      })
      .catch((err) => {
        console.error(`MongoDB connection error: ${err}`);
      });
  }

  isAlive() {
    return this.client.topology.isConnected();
  }

  async nbUsers() {
    try {
      const usersCollection = this.client.db().collection('users');
      const count = await usersCollection.countDocuments();
      return count;
    } catch (err) {
      console.log(`Error counting users: ${err}`);
      throw err;
    }
  }

  async nbFiles() {
    try {
      const filesCollection = this.client.db().collection('files');
      const count = await filesCollection.countDocuments();
      return count;
    } catch (err) {
      console.log(`Error counting files: ${err}`);
      throw err;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
