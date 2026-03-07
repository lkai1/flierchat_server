import { Server } from "socket.io";
import { getIdsFromUserChatsService } from "../../services/chatServices.js";

export const getAllUniqueSocketIdsInUserRooms = async (userId: string, io: Server): Promise<string[]> => {

    const roomIds = await getIdsFromUserChatsService(userId)
    if (!roomIds.length) return []

    const sockets = await io.in(roomIds).fetchSockets()

    const uniqueUserIds = new Set<string>()

    for (const socket of sockets) {
        if (socket.userId) {
            uniqueUserIds.add(socket.id)
        }
    }

    return [...uniqueUserIds]
}

export const getAllUniqueUserIdsInUserRooms = async (userId: string, io: Server): Promise<string[]> => {
    const roomIds = await getIdsFromUserChatsService(userId)
    if (!roomIds.length) return []

    const sockets = await io.in(roomIds).fetchSockets()

    const uniqueUserIds = new Set<string>()

    for (const socket of sockets) {
        if (socket.userId) {
            uniqueUserIds.add(socket.userId)
        }
    }

    return [...uniqueUserIds]
}