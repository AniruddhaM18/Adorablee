import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import bcrypt from "bcrypt";
import { deleteAccountSchema, signinSchema, signupSchema } from "../schema.js";
import { prisma } from "@repo/database";
import { JWT_SECRET } from "../config.js";
import { encrypt } from "../crypto.js";
import { sessionCookieOptions } from "../sessionCookie.js";

//signup controller
export async function signup(req: Request, res: Response) {
    const userData = signupSchema.safeParse(req.body);

    if (!userData.success) {
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

    if (existingUser) {
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

    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET!, {
        expiresIn: "7d"
    });

    res.cookie("sessionToken", token, sessionCookieOptions());

    return res.json({
        message: "Signup Successfull",
        user: {
            id: user.id,
            email: user.email
        }
    });
}

//signincontroller
export async function signin(req: Request, res: Response) {
    const parsed = signinSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(401).json({
            message: "Please put correct inputs"
        })
    }

    const { email, password } = parsed.data;

    const user = await prisma.user.findUnique({
        where: {
            email
        }
    });

    if (!user) {
        return res.status(401).json({
            message: "Invalid credentials/ user doesn't exist"
        })
    };

    const isValid = await bcrypt.compare(password, user.password);

    if (!isValid) {
        return res.status(401).json({
            message: "Incorrect password"
        });
    }
    const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET!, {
        expiresIn: "7d"
    });

    res.cookie("sessionToken", token, sessionCookieOptions());

    return res.json({
        message: "signin successfull",
        user: {
            id: user.id,
            email: user.email
        }
    });
}

//signot/logout
export async function logout(req: Request, res: Response) {
    res.clearCookie("sessionToken", sessionCookieOptions());

    return res.json({
        message: "Logged out successfully"
    })
};

// /me endpoint
export async function getMe(req: Request, res: Response) {
    try {
        //get token from cookie
        const token = req.cookies.sessionToken;

        if (!token) {
            return res.status(401).json({
                message: "not authienticated"
            })
        }

        const payload = jwt.verify(token, JWT_SECRET!) as { userId: string, email: string };

        const user = await prisma.user.findUnique({
            where: {
                id: payload.userId
            },
            select: {
                id: true,
                email: true
            }
        });

        if (!user) {
            return res.status(401).json({
                message: "user not found"
            })
        }

        return res.status(200).json(user);
    } catch (err) {
        return res.status(401).json({
            message: "Invalid token"
        })
    }
}

/** POST /auth/sse-token — exchange session cookie for a short-lived JWT usable only as ?token= for SSE (e.g. EventSource). */
export async function issueSseToken(req: Request, res: Response) {
  try {
    const token = req.cookies.sessionToken;
    if (!token) {
      return res.status(401).json({ message: "not authenticated" });
    }
    if (!JWT_SECRET) {
      return res.status(500).json({ message: "Internal server error" });
    }

    const payload = jwt.verify(token, JWT_SECRET) as { userId?: string; email?: string; sse?: boolean };
    if (payload.sse === true) {
      return res.status(400).json({ message: "Use session cookie to obtain an SSE token" });
    }
    if (!payload.userId || !payload.email) {
      return res.status(401).json({ message: "Invalid token" });
    }

    const sseToken = jwt.sign(
      { userId: payload.userId, email: payload.email, sse: true },
      JWT_SECRET,
      { expiresIn: "10m" }
    );

    return res.json({ token: sseToken });
  } catch (err) {
    if (err instanceof jwt.JsonWebTokenError || err instanceof jwt.TokenExpiredError) {
      return res.status(401).json({ message: "Invalid or expired token" });
    }
    console.error("issueSseToken error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

/** DELETE /auth/account — password-confirmed; cascades projects/versions when schema uses onDelete: Cascade */
export async function deleteAccount(req: Request, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const parsed = deleteAccountSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ message: "password is required" });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const ok = await bcrypt.compare(parsed.data.password, user.password);
    if (!ok) {
      return res.status(401).json({ message: "Incorrect password" });
    }

    await prisma.user.delete({ where: { id: userId } });
    res.clearCookie("sessionToken", sessionCookieOptions());
    return res.status(204).send();
  } catch (err) {
    console.error("deleteAccount error:", err);
    return res.status(500).json({ message: "Internal server error" });
  }
}

// GET /auth/api-key — returns whether the user has configured a key (never returns the key itself)
export async function getApiKeyStatus(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { openrouterApiKey: true },
        });

        return res.json({ hasKey: !!user?.openrouterApiKey });
    } catch (err) {
        console.error("getApiKeyStatus error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// PUT /auth/api-key — save (or replace) the user's OpenRouter API key
export async function updateApiKey(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { apiKey } = req.body;
        if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
            return res.status(400).json({ message: "apiKey is required" });
        }

        const encrypted = encrypt(apiKey.trim());

        await prisma.user.update({
            where: { id: userId },
            data: { openrouterApiKey: encrypted },
        });

        return res.json({ success: true, message: "API key saved" });
    } catch (err) {
        console.error("updateApiKey error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}

// PUT /auth/password — update user password
export async function updatePassword(req: Request, res: Response) {
    try {
        const userId = req.user?.id;
        if (!userId) return res.status(401).json({ message: "Unauthorized" });

        const { currentPassword, newPassword } = req.body;
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "currentPassword and newPassword are required" });
        }
        if (typeof newPassword !== "string" || newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters" });
        }

        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) return res.status(404).json({ message: "User not found" });

        const isValid = await bcrypt.compare(currentPassword, user.password);
        if (!isValid) return res.status(401).json({ message: "Current password is incorrect" });

        const hashed = await bcrypt.hash(newPassword, 10);
        await prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });

        return res.json({ success: true, message: "Password updated successfully" });
    } catch (err) {
        console.error("updatePassword error:", err);
        return res.status(500).json({ message: "Internal server error" });
    }
}