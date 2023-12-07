import express from 'express';
import pool from '../db/db_config';
import DatabaseService from '../utils/databaseService';

const router = express.Router();


// Get all invalid sender emails
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const senderList = await DatabaseService.getInvalidSenders(userId);
        if (senderList.length === 0) return res.status(200).json("0 saved emails.");
        res.json(senderList);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

// Add new invalid email
router.post('/:userId', async (req, res) => {
    const userId = req.params.userId;
    const body = req.body;
    try {
        // see if it is already saved
        const senderExists = await DatabaseService.senderExists(userId, body.email_address);
        if (senderExists) return res.status(200).json("email address already saved");

        const newRowInfo = await DatabaseService.addNewInvalidSender(userId, body.email_address);
        res.json(newRowInfo);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

// Remove invalid email
router.delete('/:userId', async (req, res) => {
    const userId = req.params.userId;
    const body = req.body;
    try {
        // if address doesnt exist then no need to delete
        const senderExists = await DatabaseService.senderExists(userId, body.email_address);
        if (!senderExists) return res.status(200).json("email address does not exist");

        await pool.query("DELETE FROM InvalidSender WHERE UserId = $1 AND EmailAddress = $2", [userId, body.email_address]);
        res.json(`Deleted address: ${body.email_address}`);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});


export default router;