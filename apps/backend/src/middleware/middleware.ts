import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { JWT_SECRET } from "../config.js";


export async function authMiddleware(req: Request, res: Response, next: NextFunction) {
    try {
        //get token from headers, cookies, or query params (for EventSource which can't send cookies)
        const token = req.cookies.sessionToken ||
            req.headers.authorization?.replace("Bearer ", "") ||
            (req.query.token as string);
        if (!token) {
            return res.status(401).json({
                message: "authentication required"
            })
        };

        //verify payload
        const payload = jwt.verify(token, JWT_SECRET!) as JwtPayload;

        req.user = {
            id: payload.userId,
            email: payload.email
        };

        next();

    } catch (err) {
        console.log(err);
        return res.status(500).json({
            message: "Internet server error"
        })
    }
}