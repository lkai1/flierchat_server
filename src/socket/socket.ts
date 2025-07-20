import { Server, Socket } from "socket.io";
import { initMessage } from "./message";
import { initChat } from "./chat";
import jwt from "jsonwebtoken";
import env_vars from "../config/environment_variables";
import { getUserFromJWTService } from "../services/userServices";
import { initUser, emitUserConnected, emitUserDisconnected } from "./user";
import { Server as HTTPServer } from "http";
import cookie from "cookie";

export const initSocket = (httpServer: HTTPServer): void => {
    const io = new Server(httpServer, {
        cors: {
            origin: "http://localhost:5173",
            credentials: true,
        }
    });

    io.use((socket: Socket, next): void => {
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

            jwt.verify(token, env_vars.TOKEN_SECRET);
            socket.token = token;
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

            jwt.verify(token, env_vars.TOKEN_SECRET);
            const user = await getUserFromJWTService(token);

            if (!user) {
                socket.disconnect(true);
                return;
            }

            // eslint-disable-next-line require-atomic-updates
            socket.userId = user.id;
            initMessage(socket);
            initChat(socket, io);
            initUser(socket, io);
            await emitUserConnected(socket, io);
            socket.on("disconnect", async () => {
                await emitUserDisconnected(socket, io);
            });
        } catch {
            socket.disconnect(true);
        }
    });
};