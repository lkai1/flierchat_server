import db from "../database/db";
import { ChatModel, MessageModel, MessageWithCreator } from "../types";

export const createMessageService = async (creatorId: string, chatId: string, value: string): Promise<MessageModel> => {
    const message = await db.messages.create({
        creatorId,
        chatId,
        value,
        timestamp: new Date().toISOString()
    });

    return message;
};

export const getMessagesFromChatService = async (
    chat: ChatModel
): Promise<MessageWithCreator[]> => {
    const messages = await db.messages.findAll({
        where: { chatId: chat.id },
        attributes: ["id", "value", "timestamp", "chatId"],
        include: {
            model: db.users,
            as: "messageCreator",
            attributes: ["id", "username"],
        },
        order: [["timestamp", "ASC"]],
    });

    return messages.map((message) => {
        return {
            id: message.id,
            value: message.value,
            timestamp: message.timestamp,
            chatId: message.chatId,
            creatorId: message.creatorId,
            messageCreator: {
                id: message.messageCreator?.id ?? "",
                username: message.messageCreator?.username ?? "",
            },
        };
    });
};



export const getMessageFromIdService = async (messageId: string): Promise<MessageModel | null> => {
    const message = await db.messages.findOne({ where: { id: messageId } });
    return message;
};

export const deleteAllUserMessagesFromChatService = async (chatId: string, userId: string): Promise<void> => {
    await db.messages.destroy({ where: { chatId, creatorId: userId } });
};

export const deleteUserMessageService = async (message: MessageModel): Promise<void> => {
    await message.destroy();
};