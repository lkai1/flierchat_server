import { getChatFromIdService, getUserIsChatParticipantService } from "../services/chatServices.js"
import { getUserFromJWTService } from "../services/userServices.js"

export const initMessage = (socket) => {
    socket.on("message", async ({ message, chatId }) => {
        try {
            const user = await getUserFromJWTService(socket.handshake.auth.token)
            const chat = await getChatFromIdService(chatId)

            if (!user || !chat) {
                socket.emit("error")
                return
            }

            const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id)

            if (userIsChatParticipant) {
                message.messageCreator = { username: user.username, id: user.id }
                const { creatorId, ...messageToSend } = message
                socket.nsp.in(chatId).emit("message", { message: messageToSend })
            } else {
                socket.emit("error")
            }
        } catch (e) {
            socket.emit("error")
        }
    })

    socket.on("messageDelete", async ({ messageId, chatId }) => {
        try {
            socket.nsp.in(chatId).emit("messageDelete", messageId)
        } catch (e) {
            socket.emit("error")
        }
    })

    socket.on("messageDeleteAll", async ({ chatId }) => {
        try {
            const user = await getUserFromJWTService(socket.handshake.auth.token)

            if (!user) {
                socket.emit("error")
                return
            }

            socket.nsp.in(chatId).emit("messageDeleteAll", { userId: user.id })
        } catch (e) {
            socket.emit("error")
        }
    })
}