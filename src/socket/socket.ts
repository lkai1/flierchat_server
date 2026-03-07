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

export const initSocket = (httpServer: HTTPServer): Server => {
    const io = new Server(httpServer, {
        cors: {
            origin: env_vars.CLIENT_ORIGIN,
            credentials: true,
        }
    });

    io.use(async (socket: Socket, next): Promise<void> => {
        try {
            const rawCookie = socket.handshake.headers.cookie;

            if (typeof rawCookie !== 'string' || rawCookie.length === 0) {
                next(new Error('No cookie found'));
                return;
            }

            const cookies = cookie.parse(rawCookie);
            const token = cookies.auth_token;

            if (typeof token !== 'string' || token.length === 0) {
                next(new Error('No auth token found'));
                return;
            }

            jwt.verify(token, env_vars.TOKEN_SECRET, { algorithms: ['HS256'] });

            const user = await getUserFromJWTService(token);

            if (user !== null) {
                socket.userId = user.id;
                next();
            } else {
                next(new Error('User not found'));
            }
        } catch (error) {
            console.error("Error in socket middleware:", error);
            next(new Error('Authentication failed'));
        }
    });

    io.on("connection", async (socket) => {
        try {
            initMessage(socket);
            initChat(socket, io);
            initUser(socket, io);
            const userChats = await getUserChatsService(socket.userId);
            const userChatsIds = userChats.map((value) => { return value.id; });
            await socket.join(userChatsIds);
            await emitUserConnected(socket, io);

            socket.on("disconnect", async (): Promise<void> => {
                await emitUserDisconnected(socket, io);
            });
        } catch (error) {
            console.error("Error on socket connection", error);
            await emitUserDisconnected(socket, io);
            socket.disconnect(true);
        }
    });

    return io;
};