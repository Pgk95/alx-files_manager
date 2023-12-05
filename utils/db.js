const { MongoClient } = require('mongodb');

class DBClient {
  constructor() {
    this.host = process.env.DB_HOST || 'localhost';
    this.port = process.env.DB_PORT || 27017;
    this.database = process.env.DB_DATABASE || 'files_manager';
    this.url = `mongodb://${this.host}:${this.port}`;
    this.client = new MongoClient(this.url, { useUnifiedTopology: true });

    this.client.connect((err) => {
      if (err) {
        console.error(err);
        this.db = false;
      } else {
        console.log('Connected to MongoDB');
      }
    });
  }

  isAlive() {
    return this.client.isConnected();
  }

  async nbUsers() {
    try {
      const db = this.client.db(this.database);
      const usersCount = await db.collection('users').countDocuments();
      return usersCount;
    } catch (error) {
      console.error(`Error getting nbUsers from MongoDB: ${error}`);
      throw error;
    }
  }

  async nbFiles() {
    try {
      const db = this.client.db(this.database);
      const filesCount = await db.collection('files').countDocuments();
      return filesCount;
    } catch (error) {
      console.error(`Error getting nbFiles from MongoDB: ${error}`);
      throw error;
    }
  }
}

const dbClient = new DBClient();
module.exports = dbClient;
