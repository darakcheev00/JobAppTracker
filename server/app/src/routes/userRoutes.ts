import express, { Request, Response } from 'express';
import { AuthedRequest, verifyToken } from '../utils/jwtService';

import { db } from '../index';

const router = express.Router();

// Get all users
router.get('/', async (req: Request, res: Response) => {
    console.log(`Hit /user endpoint`);

    try {
        const users = await db.getAllUsers();
        res.json(users);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});


// Get single user
router.get('/single', verifyToken, async (req: AuthedRequest, res: Response) => {
    console.log(`Hit /user/single endpoint`);

    const userId = req.user_id;

    try {
        const user = await db.getSingleUser(userId);
        res.json(user);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

// Create new user
// router.post('/', async (req: Request, res: Response) => {
//     const attributes = req.body;

//     // validate email
//     if (!isEmailValid(attributes.user_email)) {
//         return res.status(400).json(`Email invalid: [${attributes.user_email}]`);
//     }

//     // validate access_token
//     if (attributes.access_token < 5) {
//         return res.status(400).json("Access token invalid");
//     }

//     try {
//         const newUser = await db.addNewUser(attributes);
//         res.status(201).json(newUser);
//     } catch (error: any) {
//         res.status(500).json(error.message);
//     }

// });


// Update user
router.patch('/:userId', async (req: Request, res: Response) => {
    const userId = req.params.userId;
    const updatedUserData = req.body;

    console.log('---------------------');
    console.log(`Hit patch user endpoint: id:${userId}, new_data:${JSON.stringify(updatedUserData)}`);

    try {
        const userExists = await db.userExists(userId);
        if (!userExists) {
            return res.status(404).json({ error: 'user not found' });
        }

        const updatedUserInfo = await db.updateUserInfo(userId, updatedUserData);
        res.json(updatedUserInfo);
    } catch (err) {
        console.error("[server]: error adding user. SQL query error: ", err);
        res.status(500).json("Internal server error");
    }
});

const isEmailValid = (email: string): Boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export default router;