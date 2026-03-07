import { RemoteSocket, Server, Socket } from "socket.io";
import { emitToAllUniqueOnlineSocketsInUserRooms } from "../utils/socket_helpers/emitFunctions.js";
import { getAllUniqueUserIdsInUserRooms } from "../utils/socket_helpers/getSocketFunctions.js";
import { getChatWithParticipantIdsFromIdService } from "../services/chatServices.js";
import { getUserInfoFromIdService } from "../services/userServices.js";

interface EmitEvents {
    error(): void;
    onlineUsers(userIds: string[]): void;
}

export const emitOnlineUsersInUserChats = async (socket: Socket<object, EmitEvents> | RemoteSocket<EmitEvents, object>, io: Server): Promise<void> => {
    try {
        const user = await getUserInfoFromIdService(socket.userId);

        if (!user) {
            socket.emit("error");
            return;
        }

        const uniqueUserIdsInUserRooms = await getAllUniqueUserIdsInUserRooms(user.id, io);
        await emitToAllUniqueOnlineSocketsInUserRooms(uniqueUserIdsInUserRooms, "onlineUsers", io, user);

    } catch {
        socket.emit("error");
    }
};

export const emitUserDisconnected = async (socket: Socket, io: Server): Promise<void> => {
    try {
        const user = await getUserInfoFromIdService(socket.userId);

        if (!user) {
            socket.emit("error");
            return;
        }

        await emitToAllUniqueOnlineSocketsInUserRooms(user.id, "userDisconnected", io, user);

    } catch {
        socket.emit("error");
    }
};

export const emitUserConnected = async (socket: Socket, io: Server): Promise<void> => {
    try {
        const user = await getUserInfoFromIdService(socket.userId);

        if (!user) {
            socket.emit("error");
            return;
        }

        await emitToAllUniqueOnlineSocketsInUserRooms(user.id, "userConnected", io, user);

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
            const userChats = await Promise.all(
                userChatIds.map((chatId) => getChatWithParticipantIdsFromIdService(chatId))
            );

            const remainingChats = userChats.filter((chat) => { return chat !== null; });

            const deletedChatIds = userChatIds.filter((id) => {
                return !remainingChats.find((chat) => { return chat?.id === id; });
            });

            const uniqueParticipantIdsInRemainingChats = [...new Set(remainingChats.map((chat) => {
                return chat!.chatParticipants.map((p) => { return p.id; });
            }).flat())];

            const allSockets = await io.fetchSockets();

            const socketsInRemainingChats = allSockets.filter((userSocket) => {
                return uniqueParticipantIdsInRemainingChats.includes(userSocket.userId);
            });

            socketsInRemainingChats.forEach((userSocket) => {
                userSocket.emit("userDelete", { userId: socket.userId });
            });

            userChatIds.forEach((chatId) => {
                socket.nsp.in(chatId).emit("messageDeleteAll", { userId: socket.userId });
                socket.nsp.in(chatId).emit("chatParticipantDelete", { userId: socket.userId });
            });

            const allSockets2 = await io.fetchSockets();
            for (const chatId of deletedChatIds) {
                const socketsInDeletedChat = allSockets2.filter((userSocket) => {
                    return userSocket.rooms.has(chatId);
                });
                for (const userSocket of socketsInDeletedChat) {
                    userSocket.leave(chatId);
                    userSocket.emit("chatDelete", { chatId });
                }
            }

            for (const chatId of userChatIds) {
                await socket.leave(chatId);
            }

        } catch {
            socket.emit("error");
        }
    });
};