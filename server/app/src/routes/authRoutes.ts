import express from 'express';
import DatabaseService from '../utils/databaseService';

const router = express.Router();

export const validateToken = async (token:string) => {
    try {
        const response = await fetch(`https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=${token}`,{
            method: 'GET'
        });
        const data = await response.json();
        console.log(`Token: ${token}`);
        console.log(data);
        if (data.error) throw new Error('Google auth token invalid');
        return data;

    } catch (error) {
        console.error("Error occured during google auth token validation:", error);
        throw new Error('Internal server error');
    }
}



router.get('/login', async (req, res) => {
    const { token } = req.body;
    console.log(`Hit login endpoint with token: ${token}`);

    // Validate token
    var data: Record<string,any>;
    try {
        data = await validateToken(token);
    } catch (error) {
        return res.status(500).json(error);
    }
    
    const given_user_email = data.email;

    // Get user by email
    const user = await DatabaseService.getSingleUserByEmail(given_user_email);

    let active_token = token;
    if (user) {
        if (user.authtoken === token) {
            // if token in db matches this new one
            active_token = user.token;
        } else {
            // if token in db is stale. Override token in db
            await DatabaseService.setGoogleAuthToken(user.userid, token);
        }
    } else {
        // User doesnt exist -> create new user
        const newUser = await DatabaseService.addNewUser({
            user_email: given_user_email,
            auth_token: token
        });
        return res.status(201).json(active_token);
    }
    res.status(200).json(active_token);
});

export default router;