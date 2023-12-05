import express from 'express';
import pool from '../db';

const router = express.Router();

router.get('/', async (req, res) => {
    // sign in
    res.send('sign in response');
});


export default router;