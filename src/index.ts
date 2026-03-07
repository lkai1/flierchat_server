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
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import db from "./database/db.js";

const app = express();

app.use(helmet());

app.use(cors({
    origin: env_vars.CLIENT_ORIGIN,
    credentials: true
}));

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

const authLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 10,
    message: "Too many attempts, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

const verifyLoginLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 60,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

const generalLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 200,
    message: "Too many requests, please try again later.",
    standardHeaders: true,
    legacyHeaders: false,
});

app.use("/api/auth/login", authLimiter);
app.use("/api/auth/register", authLimiter);
app.use("/api/auth/verify_login", verifyLoginLimiter);
app.use("/api", generalLimiter);

app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
});

app.use("/api/auth", authRouter);
app.use("/api/user", userRouter);
app.use("/api/message", messageRouter);
app.use("/api/chat", chatRouter);

app.use((err: Error | undefined, _req: Request, res: Response, next: NextFunction): Response | undefined => {
    if (err) {
        return res.status(400).send("Malformed content!");
    }
    next();
    return undefined;
});

const httpServer = createServer(app);

const startApp = async (): Promise<void> => {
    await seeder();
    const io = initSocket(httpServer);
    httpServer.listen(env_vars.PORT, () => { console.log(`Server is running at port: ${env_vars.PORT}.`); });

    const shutdown = (): void => {
        console.log("Shutting down server...");

        httpServer.close(() => {
            console.log("HTTP server closed.");
        });

        io.close(() => {
            console.log("Socket.io connections closed.");
        });

        db.sequelize.close()
            .then(() => {
                console.log("Database connections closed.");
                process.exit(0);
            })
            .catch((error) => {
                console.error("Error closing database connections.", error);
                process.exit(1);
            });

        setTimeout(() => {
            console.error("Forcing shutdown after timeout.");
            process.exit(1);
        }, 10000);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
};

void startApp();