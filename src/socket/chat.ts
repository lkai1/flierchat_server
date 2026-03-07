import { Server, Socket } from "socket.io";
import { getChatWithParticipantIdsFromIdService } from "../services/chatServices.js";
import { getUserInfoFromIdService } from "../services/userServices.js";
import { emitOnlineUsersInUserChats } from "./user.js";

export const initChat = (socket: Socket, io: Server): void => {

    socket.on("chatCreate", async ({ chatId }: { chatId: string }) => {
        try {
            const chat = await getChatWithParticipantIdsFromIdService(chatId);

            if (!chat) {
                socket.emit("error");
                return;
            }

            const chatParticipantIds = chat.chatParticipants.map((participant) => { return participant.id; });
            const sockets = await io.fetchSockets();

            const participantSockets = sockets.filter((userSocket) => {
                return chatParticipantIds.includes(userSocket.userId);
            });

            for (const userSocket of participantSockets) {
                userSocket.join(chatId);
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

            for (const userSocket of participantSockets) {
                userSocket.leave(chatId);
                userSocket.emit("chatDelete", { chatId });
            }

        } catch {
            socket.emit("error");
        }
    });

    socket.on("chatParticipantAdd", async ({ chatId, participantId }: { chatId: string, participantId: string }) => {
        try {
            const chatParticipant = await getUserInfoFromIdService(participantId);

            if (!chatParticipant) {
                socket.emit("error");
                return;
            }

            const allSockets = await io.fetchSockets();
            const participantSocket = allSockets.find((userSocket) => {
                return userSocket.userId === participantId;
            });

            if (participantSocket) {
                await participantSocket.join(chatId);
                participantSocket.emit("chatCreate");
                await emitOnlineUsersInUserChats(participantSocket, io);
            }

            const socketsInChat = await io.in(chatId).fetchSockets();
            for (const userSocket of socketsInChat) {
                if (userSocket.userId === participantId) continue;
                userSocket.emit("chatParticipantAdd", { chatParticipant });
                await emitOnlineUsersInUserChats(userSocket, io);
            }

        } catch {
            socket.emit("error");
        }
    });

    socket.on("chatParticipantRemove", async ({ chatId, participantId }: { chatId: string, participantId: string }) => {
        try {
            const chat = await getChatWithParticipantIdsFromIdService(chatId);

            if (!chat) {
                socket.emit("error");
                return;
            }

            const isLeavingThemselves = participantId === socket.userId;
            const isCreatorRemovingSomeone = chat.creatorId === socket.userId;

            if (!isLeavingThemselves && !isCreatorRemovingSomeone) {
                socket.emit("error");
                return;
            }

            const socketsInChat = await io.in(chatId).fetchSockets();
            const participantSocket = socketsInChat.find((s) => { return s.userId === participantId; });

            if (participantSocket) {
                participantSocket.leave(chatId);
                participantSocket.emit("chatParticipantRemove", { participantId, chatId });
            }

            io.to(chatId).emit("chatParticipantRemove", { participantId, chatId });
            io.to(chatId).emit("messageDeleteAll", { userId: participantId });

            const remainingSockets = await io.in(chatId).fetchSockets();
            for (const userSocket of remainingSockets) {
                await emitOnlineUsersInUserChats(userSocket, io);
            }

        } catch {
            socket.emit("error");
        }
    });
};