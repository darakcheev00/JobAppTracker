import express from 'express';
import pool from '../db/db_config';
import DatabaseService from '../utils/databaseService';

const router = express.Router();

// Get all users
router.get('/', async (req,res) => {
    try{
        const users = await DatabaseService.getAllUsers();
        res.json(users);
    } catch(error: any){
        res.status(500).json(error.message);
    }
});

// Get single user
router.get('/:userId', async (req,res)=>{
    const userId = req.params.userId;
    try {
        const user = await DatabaseService.getSingleUser(userId);
        res.json(user);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

// Create new user
router.post('/', async(req,res) => {
    const attributes = req.body;

    // validate email
    if (!isEmailValid(attributes.user_email)){
        return res.status(400).json(`Email invalid: [${attributes.user_email}]`);
    }

    // validate access_token
    if (attributes.access_token < 5){
        return res.status(400).json("Access token invalid");
    }

    try{
        const newUser = await DatabaseService.addNewUser(attributes);
        res.status(201).json(newUser);
    } catch (error: any) {
        res.status(500).json(error.message);
    }

});


// Update user
router.patch('/:userId', async (req,res) => {
    const userId = req.params.userId;
    const updatedUserData = req.body;

    try {
        const userExists = await DatabaseService.userExists(userId);
        if (!userExists){
            return res.status(404).json({error: 'user not found'});
        }
        
        const updatedUserInfo = await DatabaseService.updateUserInfo(userId, updatedUserData);
        res.json(updatedUserInfo);
    } catch (err) {
        console.error("[server]: error adding user. SQL query error: ",err);
        res.status(500).json("Internal server error");
    }
});

const isEmailValid = (email: string): Boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export default router;