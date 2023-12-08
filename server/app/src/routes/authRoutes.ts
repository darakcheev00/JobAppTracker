import express, { Request, Response } from 'express';
import DatabaseService from '../utils/databaseService';
var jwt = require('jsonwebtoken');

const router = express.Router();

export const validateToken = async (token:string) => {
    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,{
            method: 'GET'
        });
        const data = await response.json();
        // console.log(`Token: ${token}`);
        if (data.error) throw new Error('Google auth token invalid');

        console.log(`Email extract from token: ${data.email}`);
        return data;

    } catch (error) {
        console.error("Error occured during google auth token validation:", error);
        throw new Error('Token is invalid');
    }
}

// const ensureTokenExists = (req: Request, res: Response, next: any) => {
//     const bearerHeader = req.headers["authorization"];
//     if (typeof bearerHeader !== 'undefined'){
//         const bearer = bearerHeader.split(" ");
//         const bearerToken = bearer[1];
//         req.token = bearerToken;
//         next();
//     } else {
//         res.sendStatus(403);
//     }
// }

router.post('/login', async (req: Request, res: Response) => {
    const {token} = req.body;
    console.log('---------------------');
    console.log(`Hit login endpoint with token: ${!token ? token : token.substring(0,25)}...`);

    // Validate token
    var data: Record<string,any>;
    try {
        data = await validateToken(token);
    } catch (error) {
        return res.status(401).json("token is invalid");
    }
    
    const given_user_email = data.email;

    let res_status = 500;
    try {
        // Get user by email
        const user = await DatabaseService.getSingleUserByEmail(given_user_email);
        console.log('User from db:', JSON.stringify(user, null, 2));
        let curr_user_id = 0;
        let curr_user_email = '';

        if (user) {
            if (user.authtoken === token) {
                // if token in db matches this new one
                console.log(`Saved token matches`);
            } else {
                // if token in db is stale. Override token in db
                console.log(`Overriding existing user token`);
                await DatabaseService.setGoogleAuthToken(user.userid, token);
            }
            curr_user_id = user.userid;
            curr_user_email = user.useremail;
            res_status = 200;
        } else {
            // User doesnt exist -> create new user
            console.log(`Creating new user with email: ${given_user_email}`);
            const newUser = await DatabaseService.addNewUser({
                user_email: given_user_email,
                auth_token: token
            });
            curr_user_id = newUser.userid;
            curr_user_email = newUser.useremail;
            res_status = 201;
        }

        // create jwt token
        const jwtToken = jwt.sign({user_id: curr_user_id, user_email: curr_user_email}, "my_secret_key_6457962398756294386");

        res.status(res_status).json({token: jwtToken});
        
    } catch (err: any) {
        return res.status(500).json({error: err.message});
    }
});

export default router;