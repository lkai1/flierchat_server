import { RemoteSocket, Server, Socket } from "socket.io";
import { verifySocketUserAndReturnUser } from "../utils/socket_helpers/verifySocketUserAndReturnUser.js";
import { emitToAllUniqueOnlineSocketsInUserRooms } from "../utils/socket_helpers/emitFunctions.js";
import { getAllUniqueUserIdsInUserRooms } from "../utils/socket_helpers/getSocketFunctions.js";
import { getChatWithParticipantIdsFromIdService } from "../services/chatServices.js";

interface EmitEvents {
    error(): void;
    onlineUsers(userIds: string[]): void; // eslint-disable-line no-unused-vars
}

export const emitOnlineUsersInUserChats = async (socket: Socket<object, EmitEvents> | RemoteSocket<EmitEvents, object>, io: Server): Promise<void> => {
    try {
        const user = await verifySocketUserAndReturnUser(socket)

        if (!user) {
            socket.emit("error")
            return;
        }

        const uniqueUserIdsInUserRooms = await getAllUniqueUserIdsInUserRooms(user.id, io)

        await emitToAllUniqueOnlineSocketsInUserRooms(uniqueUserIdsInUserRooms, "onlineUsers", io, user)

    } catch {
        socket.emit("error");
    }
};

export const emitUserDisconnected = async (socket: Socket, io: Server): Promise<void> => {
    try {
        const user = await verifySocketUserAndReturnUser(socket)

        if (!user) {
            socket.emit("error")
            return;
        }

        await emitToAllUniqueOnlineSocketsInUserRooms(user.id, "userDisconnected", io, user)

    } catch {
        socket.emit("error");
    }
};

export const emitUserConnected = async (socket: Socket, io: Server): Promise<void> => {
    try {
        const user = await verifySocketUserAndReturnUser(socket)

        if (!user) {
            socket.emit("error")
            return;
        }
        await emitToAllUniqueOnlineSocketsInUserRooms(user.id, "userConnected", io, user)

    } catch {
        socket.emit("error");
    }
};

export const initUser = (socket: Socket, io: Server): void => {
    socket.on("onlineUsers", async () => {
        await emitOnlineUsersInUserChats(socket, io);
    });

    socket.on("userDelete", async ({ userChatIds }: { userChatIds: string[] }) => {
        try {
            let userChats = await Promise.all(
                userChatIds.map((chatId) => getChatWithParticipantIdsFromIdService(chatId))
            );

            userChats = userChats.filter((chat) => { return Boolean(chat); });

            const deletedChatIds = userChatIds.filter((id) => {
                return !userChats.find((chat) => { return chat?.id === id; });
            });

            const uniqueParticipantIdsInUserChats = [...new Set(userChats.map((userChat) => {
                if (userChat !== null) {
                    return userChat.chatParticipants.map((participant) => { return participant.id; });
                }
                return [];
            }).flat())];

            const sockets = await io.fetchSockets();

            const onlineSocketsInUserChats = sockets.filter((userSocket) => {
                return uniqueParticipantIdsInUserChats.includes(userSocket.userId);
            });

            const onlineSocketsWithSelectedDeletedChat = sockets.filter((userSocket) => {
                if (typeof userSocket.selectedChat !== "string" || userSocket.selectedChat.length === 0) {
                    return false;
                }
                return deletedChatIds.includes(userSocket.selectedChat);
            });

            onlineSocketsInUserChats.forEach((userSocket) => {
                userSocket.emit("userDelete", { userId: socket.userId });
            });

            userChatIds.forEach((chatId) => {
                socket.nsp.in(chatId).emit("messageDeleteAll", { userId: socket.userId });
                socket.nsp.in(chatId).emit("chatParticipantDelete", { userId: socket.userId });
            });

            onlineSocketsWithSelectedDeletedChat.forEach((userSocket) => {
                userSocket.emit("emptySelectedChat");
            });

        } catch {
            socket.emit("error");
        }
    });
};