const redis = require('redis');
const { promisify } = require('util');

class RedisClient {
  constructor() {
    this.client = redis.createClient();

    this.client.on('error', (error) => {
      console.error(`Redis client not connected to the server: ${error.message}`);
    });

    this.getAsync = promisify(this.client.get).bind(this.client);
    this.setAsync = promisify(this.client.set).bind(this.client);
    this.delAsync = promisify(this.client.del).bind(this.client);
  }

  isAlive() {
    return this.client.connected;
  }

  async get(key) {
    try {
      const value = await this.getAsync(key);
      return value;
    } catch (error) {
      console.error(`Error getting value from Redis: ${error}`);
      throw error;
    }
  }

  async set(key, value, duration) {
    try {
      const result = await this.setAsync(key, value, 'EX', duration);
      return result === 'OK';
    } catch (error) {
      console.error(`Error setting value from Redis: ${error}`);
      throw error;
    }
  }

  async del(key) {
    try {
      const result = await this.delAsync(key);
      return result > 0;
    } catch (error) {
      console.error(`Error deleting value from Redis: ${error}`);
      throw error;
    }
  }
}

const redisClient = new RedisClient();
module.exports = redisClient;
