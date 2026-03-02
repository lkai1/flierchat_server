import { Server, Socket } from "socket.io";
import { initMessage } from "./message.js";
import { initChat } from "./chat.js";
import jwt from "jsonwebtoken";
import env_vars from "../config/environment_variables.js";
import { getUserFromJWTService } from "../services/userServices.js";
import { initUser, emitUserConnected, emitUserDisconnected } from "./user.js";
import { Server as HTTPServer } from "http";
import cookie from "cookie";
import { getUserChatsService } from "../services/chatServices.js";

export const initSocket = (httpServer: HTTPServer): void => {
    const io = new Server(httpServer, {
        cors: {
            //production
            origin: "https://www.flierchat.com",
            //development
            /* origin: "http://localhost:5173", */
            credentials: true,
        }
    });

    io.use(async (socket: Socket, next): Promise<void> => {
        try {

            const rawCookie = socket.handshake.headers.cookie;

            if (typeof rawCookie !== 'string' || rawCookie.length === 0) {
                throw new Error('No cookie found');
            }

            const cookies = cookie.parse(rawCookie);
            const token = cookies.auth_token;

            if (typeof token !== 'string' || token.length === 0) {
                throw new Error('No auth token found');
            }

            if (typeof env_vars.TOKEN_SECRET !== "string" || env_vars.TOKEN_SECRET.length === 0) {
                throw new Error("TOKEN_SECRET environment variable is required");
            }

            jwt.verify(token, env_vars.TOKEN_SECRET, { algorithms: ['HS256'] });
            const user = await getUserFromJWTService(token);

            if (user !== null) {
                socket.userId = user.id;
            } else {
                throw new Error();
            }

            next();
        } catch {
            socket.disconnect(true);
        }
    });

    io.on("connection", async (socket) => {
        try {
            const rawCookie = socket.handshake.headers.cookie;

            if (typeof rawCookie !== 'string' || rawCookie.length === 0) {
                throw new Error('No cookie found');
            }

            const cookies = cookie.parse(rawCookie);
            const token = cookies.auth_token;

            if (typeof token !== 'string' || token.length === 0) {
                throw new Error('No auth token found');
            }

            if (typeof env_vars.TOKEN_SECRET !== "string" || env_vars.TOKEN_SECRET.length === 0) {
                throw new Error("TOKEN_SECRET environment variable is required");
            }

            jwt.verify(token, env_vars.TOKEN_SECRET, { algorithms: ['HS256'] });
            const user = await getUserFromJWTService(token);

            if (!user) {
                socket.disconnect(true);
                return;
            }

            socket.userId = user.id;
            initMessage(socket);
            initChat(socket, io);
            initUser(socket, io);
            const userChats = await getUserChatsService(user.id)
            const userChatsIds = userChats.map((value) => { return value.id })
            await socket.join(userChatsIds)
            await emitUserConnected(socket, io);
            socket.on("disconnect", async (): Promise<void> => {
                await emitUserDisconnected(socket, io)
            })
        } catch (error) {
            console.error("Error on socket connection", error)
            await emitUserDisconnected(socket, io);
            socket.disconnect(true);

        }
    });
};