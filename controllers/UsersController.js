// eslint-disable-next-line no-unused-vars
const { response } = require('express');
const crypto = require('crypto');
const dbClient = require('../utils/db');

class UsersController {
  // eslint-disable-next-line consistent-return
  static async postNew(req, res) {
    const { email, password } = req.body;

    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if the emai aready exists in the database
      const existingUser = await dbClient
        .client.db(dbClient.database)
        .collection('users')
        .findOne({ email });

      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      // Hash the password using SHA1
      const hashedPassword = crypto.createHash('sha1').update(password).digest('hex');

      // Create the user in the database
      const result = await dbClient
        .client.db(dbClient.database)
        .collection('users')
        .insertOne({ email, password: hashedPassword });

      // Return the new user with only the email and id
      const insertedUser = {
        email: result.ops[0].email,
        id: result.insertedId,
      };

      res.status(201).json(insertedUser);
    } catch (error) {
      console.error(`Error creating user: ${error}`);
      res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}

module.exports = UsersController;
