import express, { Request, Response } from 'express';
import { db } from '../index';
import { AuthedRequest, verifyToken } from '../utils/jwtService';
import { log } from 'console';

const router = express.Router();

// Get all invalid sender emails
router.get('/', verifyToken, async (req: AuthedRequest, res: Response) => {
    console.log('Hit GET /invalid-senders endpoint');
    const userId = req.user_id;
    try {
        const senderList = await db.getInvalidSenders(userId);
        res.json(senderList);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

// Add new invalid email
router.post('/', verifyToken, async (req: AuthedRequest, res: Response) => {
    console.log('Hit POST /invalid-senders endpoint');
    const userId = req.user_id;
    const {newEmail} = req.body;
    try {
        if (newEmail === undefined){
            throw new Error('newEmail is undefined');
        }
        const new_email_id = await db.addNewInvalidSender(userId, newEmail);
        console.log(`returning ${new_email_id}`);
        res.status(200).json(new_email_id);

    } catch (error: any) {
        res.status(500).json(error.message);
    }
});

// Remove invalid email
router.delete('/:id', verifyToken, async (req: AuthedRequest, res: Response) => {
    console.log('Hit DELETE /invalid-senders/:id endpoint');
    const userId = req.user_id;
    const id = req.params.id;
    try {
        const deletedAddress = await db.deleteInvalidSender(userId, id);
        res.status(200).json(`Deleted address: ${deletedAddress}`);
    } catch (error: any) {
        res.status(500).json(error.message);
    }
});


export default router;