import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { log } from 'console';
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import invalidSenderRoutes from './routes/invalidSenderRoutes';
import statusRoutes from './routes/statusRoutes';
import pool from './db/db_config';


const cors = require("cors");


dotenv.config();

const app: Express = express();
// const port = process.env.PORT;
const port = 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req: Request, res: Response) => {
    res.send('home');
});

app.use('/auth', authRoutes);
app.use('/user', userRoutes);
app.use('/invalid-senders', invalidSenderRoutes);
app.use('/status', statusRoutes);

// ===========================================================================================
pool.connect()
    .then(() => {
        console.log("[server]: Connected to the database")
        
        // Handle server shutdown gracefuly.
        process.on("SIGINT", () => {
            console.log("[server]: Shutting down gracefully.");
            pool.end(()=>{
                console.log("[server]: Database connection closed.");
                process.exit(0);
            });
        });

        app.listen(port, () => {
            console.log(`[server]: running on port ${port}`);
        });
    })
    .catch(() => {
        console.error("[server]: Failed to connect to database")
        process.exit(1);
    });