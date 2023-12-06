const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
// eslint-disable-next-line no-unused-vars
const { response } = require('express');
const redisClient = require('../utils/redis');
const dbClient = require('../utils/db');

class FilesController {
  static async postUpload(req, res) {
    const token = req.header('X-Token');
    const {
      name,
      type,
      parentId,
      isPublic,
      data,
    } = req.body;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user based on the token
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // validate imputs
      if (!name) {
        return res.status(400).json({ error: 'Missing name' });
      }

      if (!type || !(['folder', 'file', 'image'].includes(type))) {
        return res.status(400).json({ error: 'Missing type' });
      }

      if ((type === 'file' || type === 'image') && !data) {
        return res.status(400).json({ error: 'Missing data' });
      }

      // validate parentId
      if (parentId) {
        const parentFile = await dbClient.client.db(dbClient.database).collection('files').findOne({ _id: parentId });

        if (!parentFile) {
          return res.status(400).json({ error: 'Parent not found' });
        }

        if (parentFile.type !== 'folder') {
          return res.status(400).json({ error: 'Parent is not a folder' });
        }
      }

      // Create a new file document
      const newFile = {
        userId,
        name,
        type,
        isPublic: isPublic || false,
        parentId: parentId || 0,
      };

      if (type === 'file' || type === 'image') {
        // store the file locally
        const storingFolderPath = process.env.FOLDER_PATH || '/tmp/files_manager';
        const localPath = path.join(storingFolderPath, uuidv4());

        // Save the file in clear (Base64 decoding)
        const fileData = Buffer.from(data, 'base64');
        fs.writeFileSync(localPath, fileData);

        newFile.localPath = localPath;
      }

      // insert the new file document inot the 'files' collection
      const result = await dbClient.client.db(dbClient.database).collection('files').insertOne(newFile);

      // Return the new file with a 201 HTTP code
      const isnertedFile = {
        _id: result.insertedId,
        userId: newFile.userId,
        name: newFile.name,
        type: newFile.type,
        parentId: newFile.parentId,
        isPublic: newFile.isPublic,
        localPath: newFile.localPath,
      };

      return res.status(201).json(isnertedFile);
    } catch (error) {
      console.error(`Error uploading file: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getShow(req, res) {
    const token = req.header('X-Token');
    const { id } = req.params;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user based on the token
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve the file with the id
      const file = await dbClient.client.db(dbClient.database).collection('files').findOne({ _id: id });

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      if (file.userId !== userId && !file.isPublic) {
        return res.status(404).json({ error: 'Not found' });
      }

      // Return the file with a 200 HTTP code
      const fileObject = {
        id: file._id,
        userId: file.userId,
        name: file.name,
        type: file.type,
        isPublic: file.isPublic,
      };

      return res.status(200).json(fileObject);
    } catch (error) {
      console.error(`Error getting file: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // eslint-disable-next-line consistent-return
  static async getIndex(req, res) {
    const token = req.header['X-Token'];
    const parentId = req.query.parentId || 0;
    const page = parseInt(req.query.page, 10) || 0;
    const pageSize = 20;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user based on the token
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // MongoDB aggregation to handle pagination and retirve the files
      const files = await dbClient.client
        .db(dbClient.database)
        .collection('files')
        .aggregate([
          { $match: { parentId } },
          { $skip: page * pageSize },
          { $limit: pageSize },
        ])
        .toArray();

      res.status(200).json(files);
    } catch (error) {
      console.error(`Error getting file: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // eslint-disable-next-line consistent-return
  static async putPublish(req, res) {
    const token = req.header['X-Token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user based on the token
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve and update the file based on the ID and user ID
      const file = await dbClient.client.db(dbClient.database).collection('files').findOneAndUpdate(
        { _id: fileId, userId },
        { $set: { isPublic: true } },
        { returnDocument: 'after' },
      );

      if (!file) {
        return res.status(404).json({ error: 'Not found' });
      }

      res.status(200).json(file.value);
    } catch (error) {
      console.error(`Error publishing file: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  // eslint-disable-next-line consistent-return
  static async putUnpublish(req, res) {
    const token = req.header['X-Token'];
    const fileId = req.params.id;

    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    try {
      // Retrieve the user based on the token
      const userId = await redisClient.get(`auth_${token}`);

      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      // Retrieve and update the file based on the ID and user ID
      const file = await dbClient.client.db(dbClient.database).collection('files').findOneAndUpdate(
        { _id: fileId, userId },
        { $set: { isPublic: false } },
        { returnDocument: 'after' },
      );

      if (!file.value) {
        return res.status(404).json({ error: 'Not found' });
      }

      res.status(200).json(file.value);
    } catch (error) {
      console.error(`Error publishing file: ${error}`);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = FilesController;
