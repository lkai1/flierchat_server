import db from "../database/db.js"

export const createMessageService = async (creatorId, chatId, value) => {
    return await db.messages.create({
        creatorId,
        chatId,
        value,
        timestamp: new Date().toISOString()
    })
}

export const getMessagesFromChatService = async (chat) => {
    return await chat.getChatMessages({
        attributes: ["id", "value", "timestamp", "chatId"],
        include: {
            model: db.users,
            as: "messageCreator",
            attributes: ["id", "username"]
        },
        order: [['timestamp', 'ASC']]
    })
}

export const getMessageFromIdService = async (messageId) => {
    return await db.messages.findOne({ where: { id: messageId } })
}

export const deleteAllUserMessagesFromChatService = async (chatId, userId) => {
    return await db.messages.destroy({ where: { chatId, creatorId: userId } })
}

export const deleteUserMessageService = async (message) => {
    return await message.destroy()
}