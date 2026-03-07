import { Socket } from "socket.io";
import { getChatFromIdService, getUserIsChatParticipantService } from "../services/chatServices.js";
import { getUserInfoFromIdService } from "../services/userServices.js";
import { MessageModel } from "../types.js";

export const initMessage = (socket: Socket): void => {
    socket.on("message", async ({ message, chatId }: { message: MessageModel, chatId: string }) => {
        try {
            const [user, chat] = await Promise.all([
                getUserInfoFromIdService(socket.userId),
                getChatFromIdService(chatId)
            ]);

            if (!user || !chat) {
                socket.emit("error");
                return;
            }

            const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id);

            if (!userIsChatParticipant) {
                socket.emit("error");
                return;
            }

            const updatedMessage = {
                ...message,
                messageCreator: { username: user.username, id: user.id }
            };
            const { creatorId, ...messageToSend } = updatedMessage;
            socket.nsp.in(chatId).emit("message", messageToSend);
        } catch {
            socket.emit("error");
        }
    });

    socket.on("messageDelete", async ({ messageId, chatId }: { messageId: string, chatId: string }): Promise<void> => {
        try {
            const userIsChatParticipant = await getUserIsChatParticipantService(socket.userId, chatId);

            if (!userIsChatParticipant) {
                socket.emit("error");
                return;
            }

            socket.nsp.in(chatId).emit("messageDelete", messageId);
        } catch {
            socket.emit("error");
        }
    });

    socket.on("messageDeleteAll", async ({ chatId }: { chatId: string }) => {
        try {
            const userIsChatParticipant = await getUserIsChatParticipantService(socket.userId, chatId);

            if (!userIsChatParticipant) {
                socket.emit("error");
                return;
            }

            socket.nsp.in(chatId).emit("messageDeleteAll", { userId: socket.userId });
        } catch {
            socket.emit("error");
        }
    });
};