/* eslint-disable no-unused-vars */
const { Worker, Queue, QueueScheduler } = require('bull');
const thumbnail = require('image-thumbnail');
const dbClient = require('./utils/db');

const fileQueue = new Queue('fileQueue');
const fileQueueScheduler = new QueueScheduler('fileQueue');

fileQueue.process(async (job) => {
  const { userId, fileId } = job.data;

  if (!fileId) {
    throw new Error('Missing fileId');
  }

  if (!userId) {
    throw new Error('Missing userId');
  }

  // Retieve the file based on the fileId and userId
  const file = await dbClient.client.db(dbClient.database).collection('files').findOne({ _id: fileId, userId });

  if (!file) {
    throw new Error('File not found');
  }

  // Generate thumbnails
  const sizes = [500, 250, 100];
  const promises = sizes.map(async (width) => {
    const thumbnailName = `${file._id}_${width}`;
    const thumbnailBuffer = await thumbnail(file.localPath, { width, height: width });
    await dbClient.client.db(dbClient.database).collection('files').updateOne({ _id: file._id }, { $set: { [thumbnailName]: thumbnailBuffer } });
  });

  await Promise.all(promises);
});

module.exports = { fileQueue };
