import { Server, Socket } from "socket.io";
import { /* getUserIsChatParticipantService,  */getChatFromIdService, getChatWithParticipantIdsFromIdService, getUserIsChatParticipantService } from "../services/chatServices.js";
import { getUserFromIdService, getUserFromJWTService } from "../services/userServices.js";
import cookie from "cookie"
import { emitOnlineUsersInUserChats } from "./user.js";
import { verifySocketUserAndReturnUser } from "../utils/socket_helpers/verifySocketUserAndReturnUser.js";

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

            const onlineSocketsInChat = sockets.filter((userSocket) => {
                return chatParticipantIds.includes(userSocket.userId);
            });
            for (const userSocket of onlineSocketsInChat) {
                userSocket.emit("chatCreate");
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

    socket.on("chatParticipantAdd", async ({ chatId, participantId }: { chatId: string, participantId: string }) => {
        try {
            const chatParticipant = await getUserFromIdService(participantId);

            if (!chatParticipant) {
                socket.emit("error");
                return;
            }

            const socketsInChat = await io.in(chatId).fetchSockets()

            const participantSocket = socketsInChat.find((userSocket) => {
                return userSocket.userId === participantId;
            });

            if (participantSocket) {
                participantSocket.emit("chatCreate");
                await emitOnlineUsersInUserChats(participantSocket, io);
            }

            for (const userSocket of socketsInChat) {
                userSocket.emit("chatParticipantAdd", { chatParticipant });
                /* should this be userConnected emit instead, if so then need frontend fixes */
                await emitOnlineUsersInUserChats(userSocket, io);
            }

        } catch {
            socket.emit("error");
        }
    });

    socket.on("chatParticipantRemove", async ({ chatId, participantId }: { chatId: string, participantId: string }) => {
        try {
            const socketsInChat = await io.in(chatId).fetchSockets();
            const participantSocket = socketsInChat.find((socket) => { return socket.userId === participantId });

            if (participantSocket) { participantSocket.leave(chatId); }

            io.to(chatId).emit("chatParticipantRemove", { participantId, chatId });
        } catch {
            socket.emit("error");
        }
    });
};