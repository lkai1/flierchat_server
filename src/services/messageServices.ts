import db from "../database/db.js";
import { ChatModel, MessageModel, MessageWithCreator } from "../types.js";

const MESSAGES_PAGE_SIZE = 50;

export const createMessageService = async (creatorId: string, chatId: string, value: string): Promise<MessageModel> => {
    const message = await db.messages.create({
        creatorId,
        chatId,
        value,
        timestamp: new Date()
    });

    return message;
};

export const getMessagesFromChatService = async (
    chat: ChatModel,
    limit: number = MESSAGES_PAGE_SIZE,
    offset: number = 0
): Promise<{ messages: MessageWithCreator[], total: number }> => {
    const { count, rows } = await db.messages.findAndCountAll({
        where: { chatId: chat.id },
        attributes: ["id", "value", "timestamp", "chatId", "creatorId"],
        include: {
            model: db.users,
            as: "messageCreator",
            attributes: ["id", "username"],
        },

        order: [["timestamp", "DESC"]],
        limit,
        offset,
    });


    const messages = rows.reverse().map((message) => {
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

    return { messages, total: count };
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