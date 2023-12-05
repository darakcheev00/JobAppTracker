import express from 'express';
import pool from '../db';

const router = express.Router();


// Get all invalid sender emails
router.get('/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query("SELECT EmailAddress FROM InvalidSender WHERE UserId = $1", [userId]);
        if (result.rows.length === 0) return res.status(200).json("0 saved emails.");
        res.json(result.rows);
    } catch (err){
        console.error("[server]: error adding user. SQL query error: ",err);
        res.status(500).json("Internal server error");
    }
});

// Add new invalid email
router.post('/:userId', async (req, res) => {
    const userId = req.params.userId;
    const body = req.body;
    try {
        // see if it is already saved
        const senderExists = await pool.query("SELECT * FROM InvalidSender WHERE UserId = $1 AND EmailAddress = $2", [userId, body.email_address]);
        if (senderExists.rows.length > 0) return res.status(200).json("email address already saved");

        const result = await pool.query("INSERT INTO InvalidSender (UserId, EmailAddress) VALUES ($1, $2) RETURNING *", [userId, body.email_address]);
        res.json(result.rows);
    } catch (err){
        console.error("[server]: error adding user. SQL query error: ",err);
        res.status(500).json("Internal server error");
    }
});

// Remove invalid email
router.delete('/:userId', async (req, res) => {
    const userId = req.params.userId;
    const body = req.body;
    try {
        // if address doesnt exist then no need to delete
        const senderExists = await pool.query("SELECT * FROM InvalidSender WHERE UserId = $1 AND EmailAddress = $2", [userId, body.email_address]);
        if (senderExists.rows.length === 0) return res.status(200).json("email address does not exist");

        const result = await pool.query("DELETE FROM InvalidSender WHERE UserId = $1 AND EmailAddress = $2", [userId, body.email_address]);
        res.json(`Deleted address: ${body.email_address}`);
    } catch (err){
        console.error("[server]: error adding user. SQL query error: ",err);
        res.status(500).json("Internal server error");
    }
});


export default router;