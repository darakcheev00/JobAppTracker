import express, { Request, Response } from 'express';
import { AuthedRequest, verifyToken } from '../utils/jwtService';

import { db } from '../index';

const router = express.Router();

// Get all users
// router.get('/', async (req: Request, res: Response) => {
//     console.log(`Hit /user endpoint`);

//     try {
//         const users = await db.getAllUsers();
//         res.json(users);
//     } catch (error: any) {
//         res.status(500).json(error.message);
//     }
// });


// Get single user
router.get('/single', verifyToken, async (req: AuthedRequest, res: Response) => {
    console.log(`Hit /user/single endpoint`);

    const userId = req.user_id;

    try {
        const user = await db.getSingleUser(userId);
        if (user){
            res.json(user);
        }else{
            throw new Error('user is null');
        }
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

// Update user
router.patch('/', verifyToken, async (req: AuthedRequest, res: Response) => {
    
    const userId = req.user_id;
    const updatedUserData = req.body;
    console.log(`Hit PATCH /user/ endpoint, new_data:${JSON.stringify(updatedUserData)}`);

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