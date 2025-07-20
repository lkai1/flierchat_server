import express, { Request, Response, NextFunction } from "express";
import env_vars from "./config/environment_variables.js";
import seeder from "./database/seeder.js";
import authRouter from "./routers/authRouter.js";
import userRouter from "./routers/userRouter.js";
import messageRouter from "./routers/messageRouter.js";
import chatRouter from "./routers/chatRouter.js";
import { createServer } from "http";
import { initSocket } from "./socket/socket.js";
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express();
const httpServer = createServer(app);

app.use(express.json());

app.use((err: Error | undefined, _req: Request, res: Response, next: NextFunction): Response | undefined => {
    if (err) {
        return res.status(400).send("Malformed content!");
    }
    next();
    return undefined;
});


app.use(cors({
    origin: 'http://localhost:5173',
    credentials: true
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/message", messageRouter);
app.use("/api/chat", chatRouter);

const startApp = async (): Promise<void> => {
    await seeder();
    initSocket(httpServer);
    httpServer.listen(env_vars.APP_PORT, () => { console.log(`Server is running at port: ${env_vars.APP_PORT}.`); });
};

void startApp();

