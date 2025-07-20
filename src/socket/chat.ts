import { Server, Socket } from "socket.io";
import { getUserIsChatParticipantService, getChatFromIdService, getChatWithParticipantIdsFromIdService } from "../services/chatServices.js";
import { getUserFromIdService, getUserFromJWTService } from "../services/userServices.js";
import { emitOnlineUsersInUserChats } from "./user.js";

export const initChat = (socket: Socket, io: Server): void => {
    socket.on("selectChat", async ({ chatId }: { chatId: string }) => {
        try {
            const user = await getUserFromJWTService(socket.token);
            const chat = await getChatFromIdService(chatId);
            if (!user || !chat) {
                socket.emit("error");
                return;
            }

            const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id);

            if (userIsChatParticipant) {
                const oldChat = socket.selectedChat;

                socket.selectedChat = chatId;

                if (oldChat !== undefined && oldChat !== chatId) {
                    await socket.leave(oldChat);
                }
                await socket.join(chatId);

            } else {
                socket.emit("error");
            }
        } catch {
            socket.emit("error");
        }
    });

    socket.on("chatCreate", async ({ chatId }: { chatId: string }) => {
        try {
            const chat = await getChatWithParticipantIdsFromIdService(chatId);

            if (!chat) {
                socket.emit("error");
                return;
            }

            const chatParticipantIds = chat.chatParticipants.map((participant) => { return participant.id; });

            const sockets = await io.fetchSockets();

            const onlineSocketsInChat = sockets.filter((userSocket) => {
                return chatParticipantIds.includes(userSocket.userId);
            });

            for (const userSocket of onlineSocketsInChat) {
                userSocket.emit("chatCreate");
                await emitOnlineUsersInUserChats(userSocket, io);
            }

        } catch {
            socket.emit("error");
        }
    });

    socket.on("chatDelete", async ({ chatId, participantIds }: { chatId: string, participantIds: string[] }) => {
        try {
            const sockets = await io.fetchSockets();

            const participantSockets = sockets.filter((userSocket) => {
                return participantIds.includes(userSocket.userId);
            });

            participantSockets.forEach((userSocket) => {
                userSocket.emit("chatDelete", { chatId });
            });
        } catch {
            socket.emit("error");
        }
    });

    socket.on("emptySelectedChat", async () => {
        try {
            const currentChat = socket.selectedChat;
            if (typeof currentChat === "string" && currentChat.length > 0) {
                await socket.leave(currentChat);
            }
            // eslint-disable-next-line require-atomic-updates
            socket.selectedChat = "";
            socket.emit("emptySelectedChat");
        } catch {
            socket.emit("error");
        }
    });

    socket.on("chatParticipantAdd", async ({ chatId, participantId }: { chatId: string, participantId: string }) => {
        try {
            const chatParticipant = await getUserFromIdService(participantId);

            if (!chatParticipant) {
                socket.emit("error");
                return;
            }

            const sockets = await io.fetchSockets();

            const onlineSocketsInChat = sockets.filter((userSocket) => {
                return userSocket.selectedChat === chatId;
            });

            const participantSocket = sockets.find((userSocket) => {
                return userSocket.userId === participantId;
            });

            if (participantSocket) {
                participantSocket.emit("chatCreate");
                await emitOnlineUsersInUserChats(participantSocket, io);
            }

            for (const userSocket of onlineSocketsInChat) {
                userSocket.emit("chatParticipantAdd", { chatParticipant });
                await emitOnlineUsersInUserChats(userSocket, io);
            }

        } catch {
            socket.emit("error");
        }
    });

    socket.on("chatParticipantRemove", async ({ chatId, participantId }: { chatId: string, participantId: string }) => {
        try {
            const user = await getUserFromJWTService(socket.token);
            const chatParticipant = await getUserFromIdService(participantId);
            const chat = await getChatFromIdService(chatId);

            if (!user || !chat || !chatParticipant) {
                socket.emit("error");
                return;
            }

            if (participantId !== user.id) {
                const sockets = await io.fetchSockets();
                const participantSocket = sockets.find((userSocket) => { return userSocket.userId === chatParticipant.id; });
                if (participantSocket && participantSocket.selectedChat !== chat.id) { participantSocket.emit("chatParticipantRemove", { userId: chatParticipant.id, chatId: chat.id }); }
            }

            socket.nsp.in(chatId).emit("chatParticipantRemove", { userId: chatParticipant.id, chatId: chat.id });
        } catch {
            socket.emit("error");
        }
    });
};