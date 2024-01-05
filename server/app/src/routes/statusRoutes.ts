import express, { Request, Response } from 'express';
import GmailService from '../utils/gmailService';
import { AuthedRequest, verifyToken } from '../utils/jwtService';
import SharedDataManager from '../utils/sharedDataManager';

import { db } from '../index';

const router = express.Router();

// get all status's from db (all saved)
router.get('/', verifyToken, async (req: AuthedRequest, res: Response) => {
    console.log(`Hit /status endpoint`);
    const userId = req.user_id;

    try {
        const allStatusUpdates = await db.getAllUserStatus(userId);

        if (allStatusUpdates.length === 0) return res.status(200).json("No entries found");

        res.json(allStatusUpdates);

    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

router.get('/types', async (req: AuthedRequest, res: Response) => {
    console.log(`Hit /status/types endpoint`);

    try {
        const mapping = SharedDataManager.getDisplayNameMapping();
        console.log(mapping)
        res.json(mapping);
        // res.sendStatus(200);
    } catch (error: any) {
        res.status(500).json(`[server]: error getting status display name mapping: ${error.message}`);
    }
});


// delete a status from db
router.delete('/:msgid', verifyToken, async (req: AuthedRequest, res: Response) => {
    console.log(`Hit DELETE /status endpoint`);
    const userId = req.user_id;
    const msgId = req.params.msgid;

    if (msgId === undefined) { 
        console.error("msgid undefined");
        res.sendStatus(500); 
    }

    try {
        await db.deleteStatus(userId, msgId);
        console.log(`deleted ${msgId} status successfully`);
        res.sendStatus(200);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});


// get new status's from db (call gpt and return new ones only)
router.get('/new', verifyToken, async (req: AuthedRequest, res: Response) => {
    console.log(`\nHit /status/new endpoint`);

    const userId = req.user_id;

    if (userId === undefined) {
        res.status(500).json('User_id could not be extracted from the jwt.');
        return;
    }

    // call gmail service
    const messages = await GmailService.processInbox(userId);
    console.log(messages);
    console.log(`END OF MESSAGES =======================================`)

    // return
    console.log(`-------------------------`);
    res.status(200).json(messages);

});


// get batch of status's from given start index from latest. 0 means newest -> -25, 25 means -25 -> -50 (if 25 is batch size).
// router.get('/:userId', async (req: Request, res: Response) => {
//     const userId = req.params.userId;
//     // const start = parseInt(req.query.start as string, 10);

//     try {
//         const result = await pool.query("SELECT * FROM AppStatus WHERE UserId = $1");
//         res.json(result.rows);
//     } catch(error: any){
//         res.status(500).json(error.message);
//     }
// });

export default router;