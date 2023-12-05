import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import { refreshEmails } from './emailController';
const cors = require("cors");


dotenv.config();

const app: Express = express();
// const port = process.env.PORT;
const port = 3000;

app.use(cors());
app.use(express.json());

const pool = require('./db');

app.get('/', (req: Request, res: Response) => {
    res.send('home');
});

app.get('/auth/', async (req, res) => {
    // sign in
    res.send('sign in response');
});

app.get('/emails/:userId', async (req, res) => {
    const userId = req.params.userId;
    try {
        const result = await pool.query("SELECT * FROM email WHERE userId = $1", [userId]);
        console.log(res.json(result.rows));
    } catch (err) {
        console.error('Error executing query', err);
        res.status(500).json('Internal server error');
    }
});

app.get('/emails/new/:userId', async (req, res) => {
    const userId = req.params.userId;
    const new_emails = refreshEmails(userId, pool);
    res.json(new_emails);
});

app.get('/invalid-senders/:userId', async (req, res) => {
    // Get list of invalid senders from db
});


// Connect to database
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