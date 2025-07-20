import { RemoteSocket, Server, Socket } from "socket.io";
import { getChatWithParticipantIdsFromIdService, getUserChatsService } from "../services/chatServices.js";
import { getUserFromJWTService } from "../services/userServices.js";

interface EmitEvents {
    error(): void;
    emptySelectedChat(): void;
    onlineUsers(userIds: string[]): void; // eslint-disable-line no-unused-vars
}

export const emitOnlineUsersInUserChats = async (socket: Socket<object, EmitEvents> | RemoteSocket<EmitEvents, object>, io: Server): Promise<void> => {
    try {
        const user = await getUserFromJWTService(socket.token);
        if (!user) {
            socket.emit("error");
            return;
        }

        const userChats = await getUserChatsService(user.id);
        const uniqueParticipantsInUserChats = [...new Set(userChats.map((userChat) => {
            //userChat.Chat.chatParticipants.map
            return userChat.chatParticipants.map((participant) => { return participant.id; });
        }).flat())];

        const sockets = await io.fetchSockets();

        const onlineSocketsInUserChats = sockets.filter((userSocket) => {
            return uniqueParticipantsInUserChats.includes(userSocket.userId);
        });
        socket.emit("onlineUsers", onlineSocketsInUserChats.map(socket => { return socket.userId; }));

    } catch {
        socket.emit("error");
    }
};

export const emitUserDisconnected = async (socket: Socket, io: Server): Promise<void> => {
    try {
        const user = await getUserFromJWTService(socket.token);
        if (!user) {
            socket.emit("error");
            return;
        }

        const userChats = await getUserChatsService(user.id);
        const uniqueParticipantsInUserChats = [...new Set(userChats.map((userChat) => {
            return userChat.chatParticipants.map((participant) => { return participant.id; });
        }).flat())];

        const sockets = await io.fetchSockets();

        const onlineSocketsInUserChats = sockets.filter((userSocket) => {
            return uniqueParticipantsInUserChats.includes(userSocket.userId);
        });

        onlineSocketsInUserChats.forEach((userSocket) => {
            userSocket.emit("userDisconnected");
        });

    } catch {
        socket.emit("error");
    }
};

export const emitUserConnected = async (socket: Socket, io: Server): Promise<void> => {
    try {

        const user = await getUserFromJWTService(socket.token);

        if (!user) {
            socket.emit("error");
            return;
        }

        const userChats = await getUserChatsService(user.id);
        const uniqueParticipantsInUserChats = [...new Set(userChats.map((userChat) => {
            return userChat.chatParticipants.map((participant) => { return participant.id; });
        }).flat())];

        const sockets = await io.fetchSockets();

        const onlineSocketsInUserChats = sockets.filter((userSocket) => {
            return uniqueParticipantsInUserChats.includes(userSocket.userId);
        });

        onlineSocketsInUserChats.forEach((userSocket) => {
            userSocket.emit("userConnected");
        });

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
                /* eslint-disable-next-line @typescript-eslint/promise-function-async, arrow-body-style*/
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
                if (userSocket.selectedChat === undefined) { throw new Error; }
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