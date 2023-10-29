import express, {Express, Request, Response } from 'express';
import dotenv from 'dotenv';
const db_client = require('./db');

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

db_client.connect()
    .then(()=>console.log("Connected to the database"))
    .catch(() => console.error("Failed to connect to database"));

app.get('/',(req: Request,res: Response) => {
    res.send('home');
});

app.get('/emails/:userId', async (req,res) => {
    const userId = req.params.userId;
    try{
        const result = await db_client.query("SELECT * FROM email WHERE userId = $1", [userId]);
        res.json(result.rows);
    } catch (err){
        console.error('Error executing query', err);
        res.status(500).json('Internal server error');
    }
});

app.listen(port, () => {
    console.log(`[server]: running on port 3000`);
}); 