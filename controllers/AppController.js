const dbClient = require('../utils/db');
const redisClient = require('../utils/redis');

class AppController {
  static async getStatus(req, res) {
    const redisAlive = redisClient.isAlive();
    const dbAlive = dbClient.isAlive();

    return res.status(200).send({ redis: redisAlive, db: dbAlive });
  }

  static async getStats(req, res) {
    try {
      const usersCount = await dbClient.nbUsers();
      const filesCount = await dbClient.nbFiles();

      return res.status(200).send({ usersCount, filesCount });
    } catch (error) {
      console.error(`Error retrieving stats: ${error}`);
      return res.status(500).json({ error: 'Internal server Error' });
    }
  }
}

module.exports = AppController;
