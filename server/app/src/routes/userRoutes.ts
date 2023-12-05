import express from 'express';
import pool from '../db';

const router = express.Router();

// Get all users
router.get('/', async (req,res) => {
    try{
        const result = await pool.query("SELECT * FROM UserAccount");
        res.json(result.rows);
    } catch(err){
        console.error('[server]: Error getting user details. SQL query error: ',err);
        res.status(500).json('Internal server error');
    }
});

// Get single user
router.get('/:userId', async (req,res)=>{
    const userId = req.params.userId;
    try {
        const result = await pool.query("SELECT * FROM UserAccount WHERE id = $1", [userId]);
        // console.log(res.json(result.rows));
        res.json(result.rows);
    } catch (err) {
        console.error('[server]: Error getting user details. SQL query error: ',err);
        res.status(500).json('Internal server error');
    }
});

// Create new user
router.post('/', async(req,res) => {
    const { email, full_name, access_token, refresh_token } =  req.body;

    // validate email
    if (!isEmailValid(email)){
        return res.status(400).json(`Email invalid: [${email}]`);
    }

    // validate access_token
    if (access_token < 5){
        return res.status(400).json("Access token invalid");
    }

    try{
        const result = await pool.query(
            'INSERT INTO UserAccount (UserEmail, FullName, AccessToken, RefreshToken) VALUES ($1, $2, $3, $4) RETURNING *',
            [email, full_name, access_token, refresh_token]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error("[server]: error adding user. SQL query error: ",err);
        res.status(500).json("Internal server error");
    }

});

const user_table_map: {[key:string]:string}= {
    "user_email":"UserEmail",
    "full_name":"FullName",
    "access_token":"AccessToken",
    "refresh_token":"RefreshToken"
}

// Update user
router.patch('/:userId', async (req,res) => {
    const userId = req.params.userId;
    const updatedUserData = req.body;

    try {
        const userExists = await pool.query("SELECT * FROM UserAccount WHERE id = $1", [userId]);
        if (userExists.rows.length === 0){
            return res.status(404).json({error: 'user not found'});
        }
        
        // Build dynamic set
        const setClause = Object.keys(updatedUserData)
            .map((key,index) => `${user_table_map[key]} = $${index + 2}`)
            .join(', ');

        // Construct dynamic sql query
        const queryString = `UPDATE UserAccount SET ${setClause} WHERE id = $1 RETURNING *`;
        
        console.log(queryString);

        // Execute query
        const result = await pool.query(queryString, [userId, ...Object.values(updatedUserData)]);
        res.json(result.rows[0]);


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