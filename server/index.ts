import express, {Express, Request, Response } from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app: Express = express();
const port = process.env.PORT;

app.get('/',(req: Request,res: Response) => {
    res.send('pizdets');
});

app.listen(port, () => {
    console.log(`[server]: running on port 3000`);
}); 