import { Socket } from "socket.io";
import { getChatFromIdService, getUserIsChatParticipantService } from "../services/chatServices.ts";
import { getUserFromJWTService } from "../services/userServices.ts";
import { MessageModel } from "../types.ts";

export const initMessage = (socket: Socket): void => {
    socket.on("message", async ({ message, chatId }: { message: MessageModel, chatId: string }) => {
        try {
            const user = await getUserFromJWTService(socket.token);
            const chat = await getChatFromIdService(chatId);

            if (!user || !chat) {
                socket.emit("error");
                return;
            }

            const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id);

            if (userIsChatParticipant) {
                const updatedMessage = {
                    ...message,
                    messageCreator: { username: user.username, id: user.id }
                };
                // eslint-disable-next-line no-unused-vars
                const { creatorId, ...messageToSend } = updatedMessage;
                socket.nsp.in(chatId).emit("message", { message: messageToSend });
            } else {
                socket.emit("error");
            }
        } catch {
            socket.emit("error");
        }
    });

    socket.on("messageDelete", ({ messageId, chatId }: { messageId: string, chatId: string }): void => {
        try {
            socket.nsp.in(chatId).emit("messageDelete", messageId);
        } catch {
            socket.emit("error");
        }
    });

    socket.on("messageDeleteAll", async ({ chatId }: { chatId: string }) => {
        try {
            const user = await getUserFromJWTService(socket.token);

            if (!user) {
                socket.emit("error");
                return;
            }

            socket.nsp.in(chatId).emit("messageDeleteAll", { userId: user.id });
        } catch {
            socket.emit("error");
        }
    });
};