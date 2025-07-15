import { getUserFromJWTService } from "../services/userServices.js"
import { validateCreateMessageParams, validateGetChatMessagesParams, validateDeleteAllUserMessagesFromChatParams, validateDeleteUserMessageParams } from "../utils/validation/messageValidation.js"
import { getChatFromIdService, getUserIsChatParticipantService } from "../services/chatServices.js"
import { createMessageService, deleteAllUserMessagesFromChatService, deleteUserMessageService, getMessageFromIdService, getMessagesFromChatService } from "../services/messageServices.js"

export const createMessageController = async (request, response) => {
    try {

        if (!validateCreateMessageParams(request.body)) return response.status(400).send("Invalid parameters!")

        const { chatId, message } = request.body
        const token = request.headers.authorization
        const user = await getUserFromJWTService(token)
        const chat = await getChatFromIdService(chatId)

        if (!chat || !user) return response.status(404).send("Chat or user not found!")

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id)

        if (!userIsChatParticipant) return response.status(401).send("Unauthorized!")

        const messageToSend = await createMessageService(user.id, chat.id, message)

        response.status(201).json(messageToSend)

    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}

export const getChatMessagesController = async (request, response) => {
    try {

        if (!validateGetChatMessagesParams(request.query)) return response.status(400).send("Invalid parameters!")

        const { chatId } = request.query
        const token = request.headers.authorization
        const user = await getUserFromJWTService(token)
        const chat = await getChatFromIdService(chatId)

        if (!chat || !user) return response.status(404).send("Chat or user not found!")

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id)

        if (!userIsChatParticipant) return response.status(401).send("Unauthorized!")

        const messages = await getMessagesFromChatService(chat)

        response.status(200).json(messages)

    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}

export const deleteAllUserMessagesFromChatController = async (request, response) => {
    try {

        if (!validateDeleteAllUserMessagesFromChatParams(request.body)) return response.status(400).send("Invalid parameters!")

        const token = request.headers.authorization
        const { chatId } = request.body
        const user = await getUserFromJWTService(token)
        const chat = await getChatFromIdService(chatId)

        if (!chat || !user) return response.status(404).send("Chat or user not found!")

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id)

        if (!userIsChatParticipant) return response.status(403).send("User is not chat participant!")

        await deleteAllUserMessagesFromChatService(chat.id, user.id)

        response.status(200).send("All user messages deleted from chat.")

    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}

export const deleteUserMessageController = async (request, response) => {
    try {

        if (!validateDeleteUserMessageParams(request.body)) return response.status(400).send("Invalid parameters!")

        const token = request.headers.authorization
        const { messageId } = request.body
        const user = await getUserFromJWTService(token)
        const message = await getMessageFromIdService(messageId)

        if (!message || !user) return response.status(404).send("Message or user not found!")

        if (user.id !== message.creatorId) return response.status(403).send("You are not message creator!")

        await deleteUserMessageService(message)

        response.status(200).send("Message deleted.")

    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}