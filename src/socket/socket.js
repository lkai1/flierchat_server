import { Server } from "socket.io"
import { initMessage } from "./message.js"
import { initChat } from "./chat.js"
import jwt from "jsonwebtoken"
import env_vars from "../config/environment_variables.js"
import { getUserFromJWTService } from "../services/userServices.js"
import { emitUserConnected, emitUserDisconnected } from "./user.js"
import { initUser } from "./user.js"

export const initSocket = (httpServer) => {
    const io = new Server(httpServer)

    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token
            jwt.verify(token, env_vars.TOKEN_SECRET)
            socket.token = token
            next()
        } catch (e) {
            socket.disconnect(true)
        }
    })

    io.on("connection", async (socket) => {
        try {
            const token = socket.handshake.auth.token
            jwt.verify(token, env_vars.TOKEN_SECRET)
            const user = await getUserFromJWTService(token)
            socket.userId = user.id
            initMessage(socket)
            initChat(socket, io)
            initUser(socket, io)
            await emitUserConnected(socket, io)
            socket.on("disconnect", async () => {
                await emitUserDisconnected(socket, io)
            })
        } catch (e) {
            socket.disconnect(true)
        }
    })
}