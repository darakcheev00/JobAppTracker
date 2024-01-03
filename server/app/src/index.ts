import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { log } from 'console';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import invalidSenderRoutes from './routes/invalidSenderRoutes';
import statusRoutes from './routes/statusRoutes';
import DatabaseService from './utils/databaseService';
import SharedDataManager from './utils/sharedDataManager';

const cors = require("cors");

dotenv.config();

const app: Express = express();
// const port = process.env.PORT;
const port = 3000;

app.use(cors());
app.use(express.json());

export const db: DatabaseService = new DatabaseService();

app.get('/', (req: Request, res: Response) => {
    res.send('home');
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/invalid-senders', invalidSenderRoutes);
app.use('/status', statusRoutes);

app.get('/healthcheck', (req: Request, res: Response) => {
    console.log("Hit healthcheck!");
    res.sendStatus(200);
});

// ===========================================================================================
async function startServer() {
    try {
        await db.connect();

        const { gptStatusMapping, displayNameMapping } = await db.getStatusTypes();

        // Use statusTypes throughout your application
        SharedDataManager.setGptStatusMapping(gptStatusMapping);
        SharedDataManager.setDisplayNameMapping(displayNameMapping);

        // Handle server shutdown gracefuly.
        process.on("SIGINT", () => {
            console.log("[server]: Shutting down gracefully.");
            db.close();
        });

        app.listen(port, () => {
            console.log(`[server]: running on port ${port}`);
        });
    }
    catch (err: any) {
        console.error(`[server]: ${err}`)
        process.exit(1);
    }
}

startServer();

    // .then(() =>
    //     db.addNewInvalidEmails(1, ['a', 'b', 'c'])
    //         .then(() => console.log("added emails to invalid sender table"))
    //         .catch(() => console.log("FAILED TO add emails to invalid sender table"))
    // );


