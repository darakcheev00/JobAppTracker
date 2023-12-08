import express, { Request, Response } from 'express';
import pool from '../db/db_config';
import GmailService from '../utils/gmailService';
import DatabaseService from '../utils/databaseService';

const router = express.Router();

// get all status's from db (all saved)
router.get('/:userId', async (req: Request, res: Response) => {
    const userId = req.params.userId;
    try {
        const allStatusUpdates = await DatabaseService.getAllUserStatus(userId);

        if (allStatusUpdates.length === 0) return res.status(200).json("No entries found");

        res.json(allStatusUpdates);

    } catch(error: any){
        res.status(500).json(error.message);
    }
});


// get new status's from db (call gpt and return new ones only)
router.get('/new/:userId', async (req:Request, res: Response) => {
    const userId = req.params.userId;

    let newestMsgDate = null;

    // get latest update datetime from db
    const lastUpdates = await DatabaseService.getLatestStatusDate(userId);
    if (lastUpdates.length > 0){
        newestMsgDate = lastUpdates[0].date; // may break
    }
    // TODO: if newestMsgDate is not set then get past 25

    // TODO check if invalidSenderList type is valid
    const invalidSenderList = await DatabaseService.getInvalidSenders(userId);

    const googleAuthToken = "ya29.a0AfB_byDBUWgqcrzaDr1zIMfT7bdM62HgViyKB8a9B3mKHCJSuvqG7-xTEBgngyrvJEqPycOPWUF0oXWGEKPjWWAunvd0LnNN4XZVfcMVrAPT6eQxTpnoXrGbEs9Ldf_N_ji94doTlo967vNw8LGAp62pfRak3WmVcgaCgYKASMSARISFQHGX2MiC3x_mrS7ntow1vUNi4Y4Rw0169";
    const gptKey = "574839";
    
    // call gmail service
    const {} = GmailService.processInbox(googleAuthToken, newestMsgDate, gptKey, invalidSenderList);
        // get new emails

        // filter

        // gpt

    // returns good messages where we save them

    // save to db

    // return
     
});


// get batch of status's from given start index from latest. 0 means newest -> -25, 25 means -25 -> -50 (if 25 is batch size).
router.get('/:userId', async (req: Request, res: Response) => {
    const userId = req.params.userId;
    // const start = parseInt(req.query.start as string, 10);

    try {
        const result = await pool.query("SELECT * FROM AppStatus WHERE UserId = $1");
        res.json(result.rows);
    } catch(error: any){
        res.status(500).json(error.message);
    }
});


export default router;