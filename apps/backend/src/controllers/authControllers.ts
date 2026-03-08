import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { signinSchema, signupSchema } from "../schema.js";
import { prisma } from "@repo/database";
import { JWT_SECRET } from "../config.js";

//signup controller
export async function signup(req:Request, res:Response) {
    const userData = signupSchema.safeParse(req.body);

    if(!userData.success) {
        return res.status(400).json({
            message: "Invalid inputs"
        });
    }

    const { email, password } = userData.data;

    const existingUser = await prisma.user.findUnique({
        where: { 
            email
        }
    })

    if(existingUser){
        return res.status(409).json({
            message: "User already exists"
        })
    }

    //actual work
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
        data: {
            email,
            password: hashedPassword
        }
    });

    const token = jwt.sign({userId: user.id, email: user.email}, JWT_SECRET!, {
        expiresIn: "7d"
    });

    res.cookie("sessionToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
        message: "Signup Successfull",
        user: {
            id: user.id,
            email: user.email
        }
    });
}

//signincontroller
export async function signin(req: Request, res: Response){
    const parsed = signinSchema.safeParse(req.body);

    if(!parsed.success){
        return res.status(401).json({
            message: "Please put correct inputs"
        })
    }

    const {email, password} = parsed.data;

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if(!user){
        return res.status(401).json({
            message: "Invalid credentials/ user doesn't exist"
        })
    };

    const isValid = await bcrypt.compare(password, user.password);

    if(!isValid) {
        return res.status(401).json({
            message: "Incorrect password"
        });
    }
    const token = jwt.sign({userId: user.id, email: user.email}, JWT_SECRET!, {
        expiresIn:  "7d"
    });

    res.cookie("sessionToken", token, {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        path: "/",
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({
        message: "signin successfull",
        user: {
            id: user.id,
            email: user.email
        }
    });
}

//signot/logout
export async function logout(req: Request, res: Response){
    res.clearCookie("sessionToken", { path: "/" });

    return res.json({
        message: "Logged out successfully"
    })
};

// /me endpoint
export async function getMe(req: Request, res: Response){
    try{
        //get token from cookie
        const token = req.cookies.sessionToken;

        if(!token) {
            return res.status(401).json({
                message: "not authienticated"
            })
        }

        const payload = jwt.verify(token, JWT_SECRET!) as {userId: string, email: string};

        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId
            },
            select: {
                id:true,
                email: true
            }
        });

        if(!user){
            return res.status(401).json({
                message: "user not found"
            })
        }

        return res.status(201).json(user);
    }catch(err) {
        return res.status(401).json({
            message: "Invalid token"
        })
    }
}