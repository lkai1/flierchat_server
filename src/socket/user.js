import { getChatWithParticipantIdsFromIdService, getUserChatsService } from "../services/chatServices.js"
import { getUserFromJWTService } from "../services/userServices.js"

export const emitOnlineUsersInUserChats = async (socket, io) => {
    try {
        const user = await getUserFromJWTService(socket.handshake.auth.token)
        if (!user) {
            socket.emit("error")
            return
        }

        const userChats = await getUserChatsService(user)
        const uniqueParticipantsInUserChats = [...new Set(userChats.map((userChat) => {
            return userChat.Chat.chatParticipants.map((participant) => { return participant.id })
        }).flat())]

        const sockets = await io.fetchSockets()

        const onlineSocketsInUserChats = sockets.filter((userSocket) => {
            return uniqueParticipantsInUserChats.includes(userSocket.userId)
        })
        socket.emit("onlineUsers", onlineSocketsInUserChats.map(socket => socket.userId))

    } catch (e) {
        socket.emit("error")
    }
}

export const emitUserDisconnected = async (socket, io) => {
    try {
        const user = await getUserFromJWTService(socket.handshake.auth.token)
        if (!user) {
            socket.emit("error")
            return
        }

        const userChats = await getUserChatsService(user)
        const uniqueParticipantsInUserChats = [...new Set(userChats.map((userChat) => {
            return userChat.Chat.chatParticipants.map((participant) => { return participant.id })
        }).flat())]

        const sockets = await io.fetchSockets()

        const onlineSocketsInUserChats = sockets.filter((userSocket) => {
            return uniqueParticipantsInUserChats.includes(userSocket.userId)
        })

        onlineSocketsInUserChats.forEach((userSocket) => {
            userSocket.emit("userDisconnected")
        })

    } catch (e) {
        socket.emit("error")
    }
}

export const emitUserConnected = async (socket, io) => {
    try {

        const user = await getUserFromJWTService(socket.handshake.auth.token)

        if (!user) {
            socket.emit("error")
            return
        }

        const userChats = await getUserChatsService(user)
        const uniqueParticipantsInUserChats = [...new Set(userChats.map((userChat) => {
            return userChat.Chat.chatParticipants.map((participant) => { return participant.id })
        }).flat())]

        const sockets = await io.fetchSockets()

        const onlineSocketsInUserChats = sockets.filter((userSocket) => {
            return uniqueParticipantsInUserChats.includes(userSocket.userId)
        })

        onlineSocketsInUserChats.forEach((userSocket) => {
            userSocket.emit("userConnected")
        })

    } catch (e) {
        socket.emit("error")
    }
}

export const initUser = (socket, io) => {
    socket.on("onlineUsers", async () => {
        await emitOnlineUsersInUserChats(socket, io)
    })

    socket.on("userDelete", async ({ userChatIds }) => {
        try {

            let userChats = await Promise.all(userChatIds.map(async (chatId) => {
                return await getChatWithParticipantIdsFromIdService(chatId)
            }))

            userChats = userChats.filter((chat) => chat ? true : false)

            const deletedChatIds = userChatIds.filter((id) => {
                return userChats.find((chat) => chat?.id === id) ? false : true
            })

            const uniqueParticipantIdsInUserChats = [...new Set(userChats.map((userChat) => {
                return userChat.ChatParticipants.map((participant) => { return participant.userId })
            }).flat())]

            const sockets = await io.fetchSockets()

            const onlineSocketsInUserChats = sockets.filter((userSocket) => {
                return uniqueParticipantIdsInUserChats.includes(userSocket.userId)
            })

            const onlineSocketsWithSelectedDeletedChat = sockets.filter((userSocket) => {
                return deletedChatIds.includes(userSocket.selectedChat)
            })

            onlineSocketsInUserChats.forEach((userSocket) => {
                userSocket.emit("userDelete", { userId: socket.userId })
            })

            userChatIds.forEach((chatId) => {
                socket.nsp.in(chatId).emit("messageDeleteAll", { userId: socket.userId })
                socket.nsp.in(chatId).emit("chatParticipantDelete", { userId: socket.userId })
            })

            onlineSocketsWithSelectedDeletedChat.forEach((userSocket) => {
                userSocket.emit("emptySelectedChat")
            })

        } catch (e) {
            socket.emit("error")
        }
    })
}