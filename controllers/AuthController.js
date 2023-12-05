/* eslint-disable no-unused-vars */
const { response } = require('express');
const { v4: uuidv4 } = require('uuid');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class AuthController {
  // eslint-disable-next-line consistent-return
  static async getConnect(req, res) {
    const authHeader = req.header.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const base64Credentials = authHeader.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [email, password] = credentials.split(':');

    try {
      // eslint-disable-next-line no-undef
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');
      const user = await dbClient.client.db(dbClient.database).collection('users').findOne({ email, password: hashedPassword });

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // Generate a random token
      const token = uuidv4();

      // Store the user ID in Redis with the token as the key, set the token to expire in 24 hours
      await redisClient.set(`auth_${token}`, user._id.toString(), 86400);

      res.status(200).json({ token });
    } catch (error) {
      console.error(`Error connecting user: ${error}`);
      res.status(500).json({ error: 'Intrenal Server error' });
    }
  }

  // eslint-disable-next-line consistent-return
  static async getDisconnect(req, res) {
    const token = req.header('X-Token');

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user based on the token
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      // Delete the token in Redis
      await redisClient.del(`auth_${token}`);

      res.status(204).end();
    } catch (error) {
      console.error(`Error disconnecting user: ${error}`);
      res.status(500).json({ error: 'Intrenal Server error' });
    }
  }
}

module.exports = AuthController;
