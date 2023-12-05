// controllers/UsersController.js
import { hash } from 'bcrypt';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';

class UsersController {
  static async postNew(req, res) {
    const { email, password } = req.body;

    // Check if email and password are provided
    if (!email) {
      return res.status(400).json({ error: 'Missing email' });
    }

    if (!password) {
      return res.status(400).json({ error: 'Missing password' });
    }

    try {
      // Check if the email already exists in the database
      const existingUser = await dbClient.db.collection('users').findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exists' });
      }

      // Hash the password using bcrypt
      const hashedPassword = await hash(password, 10);

      // Create the new user document
      const newUser = {
        email,
        password: hashedPassword,
      };

      // Insert the new user into the users collection
      const result = await dbClient.db.collection('users').insertOne(newUser);

      // Return the newly created user with only email and id
      const insertedUser = {
        id: result.insertedId,
        email,
      };

      return res.status(201).json(insertedUser);
    } catch (error) {
      console.error(`Error creating user: ${error}`);
      return res.status(500).json({ error: 'Internal server error' });
    }
  }
}

export default UsersController;
