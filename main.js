import { resolve } from 'mongodb/lib/core/topologies/read_preference';
import redisClient from './utils/redis';

(async () => {
  await new Promise((resolve) => {
    redisClient.client.on('ready', () => {
      resolve();
    });
  });
  console.log(redisClient.isAlive());
  console.log(await redisClient.get('myKey'));
  await redisClient.set('myKey', 12, 5);
  console.log(await redisClient.get('myKey'));

  setTimeout(async () => {
    console.log(await redisClient.get('myKey'));
  }, 1000 * 10);
})();
