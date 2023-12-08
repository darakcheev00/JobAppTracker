import express, { Request, Response } from 'express';
var jwt = require('jsonwebtoken');


export interface AuthedRequest extends Request {
    user_id?: string;
}

export const verifyToken = (req: AuthedRequest, res: Response, next: any) => {
    const bearerHeader = req.headers["authorization"];

    if (typeof bearerHeader !== 'undefined'){
        const bearer = bearerHeader.split(" ");

        if (bearer.length < 2){
            res.sendStatus(403).json({
                success:false,
                message:'Unauthorized - no token'
            });
        }

        const bearerToken = bearer[1];

        try {
            var decoded = jwt.verify(bearerToken, process.env.JWT_KEY);
            req.user_id = decoded.user_id;
            console.log(`data extracted from jwt: ${decoded.user_id}, ${decoded.user_email}`);
            next();

        } catch (err: any) {
            let msg = err.message;
            if (err instanceof jwt.TokenExpiredError){
                msg = "token expired";
            }

            return res.sendStatus(403).send({
                success:false,
                message: msg
            });
        }
    } else {
        res.sendStatus(403).json({
            success:false,
            message:'Unauthorized - invalid token'
        });
    }   
}
