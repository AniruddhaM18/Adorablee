import express from "express";
import cors from "cors";
import projectRouter from "./routes/projectRouter.js";
import authRouter from "./routes/authRouter.js";
import cookieParser from "cookie-parser";
import { tr } from "zod/locales";
import chatRouter from "./routes/chatRoutes.js";


const app = express();

//cors before routes
app.use(cors({
    origin: process.env.FRONTEND_URL,
    credentials: true, //allow cookies,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
}))

app.use(cookieParser());     
app.use(express.json());


app.use("/project", projectRouter);

app.use("/auth", authRouter);

app.use("/api", chatRouter);


app.listen(3001, () => {
    console.log("Server running @:3001")
})

