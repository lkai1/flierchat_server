import express from "express"
import env_vars from "./config/environment_variables.js"
import seeder from "./database/seeder.js"
import authRouter from "./routers/authRouter.js"
import userRouter from "./routers/userRouter.js"
import messageRouter from "./routers/messageRouter.js"
import chatRouter from "./routers/chatRouter.js"
import { createServer } from "http"
import { initSocket } from "./socket/socket.js"
import path from "path"
import { fileURLToPath } from "url"
import cors from 'cors';
import cookieParser from "cookie-parser";

const app = express()
const httpServer = createServer(app)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

app.use((request, response, next) => {
    express.json()(request, response, error => {
        if (error) {
            return response.status(400).send("Malformed content!")
        }
        next();
    });
});

app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true
}));
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }))
app.use("/api/auth", authRouter)
app.use("/api/user", userRouter)
app.use("/api/message", messageRouter)
app.use("/api/chat", chatRouter)

if (process.env.NODE_ENV === "production") {
    app.use(express.static(path.join(__dirname, '../build')))
    app.get('/*', function (req, res, next) {
        if (!req.path.includes('api')) {
            res.sendFile(path.join(__dirname, '../build', 'index.html'))
        } else next()
    });
}

const startApp = async () => {
    await seeder()
    initSocket(httpServer)
    httpServer.listen(env_vars.APP_PORT, () => console.log(`Server is running at port: ${env_vars.APP_PORT}.`))
}

startApp()

