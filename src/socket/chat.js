import { getUserIsChatParticipantService, getChatFromIdService, getChatWithParticipantIdsFromIdService } from "../services/chatServices.js"
import { getUserFromIdService, getUserFromJWTService } from "../services/userServices.js"
import { emitOnlineUsersInUserChats } from "./user.js"

export const initChat = (socket, io) => {
    socket.on("selectChat", async ({ chatId }) => {
        try {
            const user = await getUserFromJWTService(socket.handshake.auth.token)
            const chat = await getChatFromIdService(chatId)
            if (!user || !chat) {
                socket.emit("error")
                return
            }

            const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id)

            if (userIsChatParticipant) {
                socket.leave(socket.selectedChat)
                socket.join(chatId)
                socket.selectedChat = chatId
            } else {
                socket.emit("error")
            }
        } catch (e) {
            socket.emit("error")
        }
    })

    socket.on("chatCreate", async ({ chatId }) => {
        try {
            const chat = await getChatWithParticipantIdsFromIdService(chatId)

            if (!chat) {
                socket.emit("error")
                return
            }

            const chatParticipantIds = chat.ChatParticipants.map((participant) => { return participant.userId })

            const sockets = await io.fetchSockets()

            const onlineSocketsInChat = sockets.filter((userSocket) => {
                return chatParticipantIds.includes(userSocket.userId)
            })

            onlineSocketsInChat.forEach(async (userSocket) => {
                userSocket.emit("chatCreate")
                await emitOnlineUsersInUserChats(userSocket, io)
            })

        } catch (e) {
            socket.emit("error")
        }
    })

    socket.on("chatDelete", async ({ chatId, participantIds }) => {
        try {
            const sockets = await io.fetchSockets()

            const participantSockets = sockets.filter((userSocket) => {
                return participantIds.includes(userSocket.userId)
            })

            participantSockets.forEach((userSocket) => {
                userSocket.emit("chatDelete", { chatId })
            })
        } catch (e) {
            socket.emit("error")
        }
    })

    socket.on("emptySelectedChat", () => {
        try {
            socket.leave(socket.selectedChat)
            socket.selectedChat = ""
            socket.emit("emptySelectedChat")
        } catch (e) {
            socket.emit("error")
        }
    })

    socket.on("chatParticipantAdd", async ({ chatId, participantId }) => {
        try {
            const chatParticipant = await getUserFromIdService(participantId)

            if (!chatParticipant) {
                socket.emit("error")
                return
            }

            const sockets = await io.fetchSockets()

            const onlineSocketsInChat = sockets.filter((userSocket) => {
                return userSocket.selectedChat === chatId
            })

            const participantSocket = sockets.find((userSocket) => {
                return userSocket.userId === participantId
            })

            if (participantSocket) {
                participantSocket.emit("chatCreate")
                await emitOnlineUsersInUserChats(participantSocket, io)
            }

            onlineSocketsInChat.forEach(async (userSocket) => {
                userSocket.emit("chatParticipantAdd", { chatParticipant })
                await emitOnlineUsersInUserChats(userSocket, io)
            })

        } catch (e) {
            socket.emit("error")
        }
    })

    socket.on("chatParticipantRemove", async ({ chatId, participantId }) => {
        try {
            const user = await getUserFromJWTService(socket.handshake.auth.token)
            const chatParticipant = await getUserFromIdService(participantId)
            const chat = await getChatFromIdService(chatId)

            if (!user || !chat || !chatParticipant) {
                socket.emit("error")
                return
            }

            if (participantId !== user.id) {
                const sockets = await io.fetchSockets()
                const participantSocket = sockets.find((userSocket) => { return userSocket.userId === chatParticipant.id })
                if (participantSocket && participantSocket.selectedChat !== chat.id) participantSocket.emit("chatParticipantRemove", { userId: chatParticipant.id, chatId: chat.id })
            }

            socket.nsp.in(chatId).emit("chatParticipantRemove", { userId: chatParticipant.id, chatId: chat.id })
        } catch (e) {
            socket.emit("error")
        }
    })
}