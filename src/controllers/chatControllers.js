import {
    validateCreatePrivateChatParams,
    validateCreateGroupChatParams,
    validateAddGroupChatParticipantParams,
    validateRemoveChatParticipantParams,
    validateDeleteChatParams,
    validateGetUnreadMessagesInChatParams,
    validateUpdateUnreadMessagesInChatParams
} from "../utils/validation/chatValidation.js"
import {
    createPrivateChatService,
    createGroupChatService,
    getPrivateChatBetweenUsersService,
    getUserChatsService,
    getGroupChatNameExistsService,
    getChatFromIdService,
    getUserIsChatParticipantService,
    getUserIsChatCreatorService,
    addGroupChatParticipantService,
    deleteChatService,
    removeChatParticipantService,
    getChatLastOpenedByUserService,
    getUnreadMessagesAmountInChatService,
    updateChatLastOpenedByUserService
} from "../services/chatServices.js"
import { getUserFromIdService, getUserFromJWTService, getUserFromUsernameService } from "../services/userServices.js"

export const createPrivateChatController = async (request, response) => {
    try {

        if (!validateCreatePrivateChatParams(request.body)) return response.status(400).send("Invalid parameters!")

        const { participantUsername } = request.body
        const token = request.headers.authorization

        const user = await getUserFromJWTService(token)
        const participant = await getUserFromUsernameService(participantUsername)

        if (!user || !participant) return response.status(404).send("User or users not found.")

        if (user.id === participant.id) {
            return response.status(403).send("Can't create a private chat with yourself!")
        }

        const privateChatBetweenUsers = await getPrivateChatBetweenUsersService(user.id, participant.id)

        if (privateChatBetweenUsers) return response.status(403).send("Private chat between these users already exists!")

        const chatId = await createPrivateChatService(user, participant)

        await updateChatLastOpenedByUserService(user.id, chatId)
        await updateChatLastOpenedByUserService(participant.id, chatId)

        response.status(201).json(chatId)
    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}

export const createGroupChatController = async (request, response) => {
    try {

        if (!validateCreateGroupChatParams(request.body)) return response.status(400).send("Invalid parameters!")

        const { chatName } = request.body
        const token = request.headers.authorization

        const user = await getUserFromJWTService(token)

        if (!user) return response.status(404).send("User not found.")

        const chatNameExists = await getGroupChatNameExistsService(chatName)
        if (chatNameExists) return response.status(403).send("Group chat name is already taken.")

        const chatId = await createGroupChatService(user, chatName)

        await updateChatLastOpenedByUserService(user.id, chatId)

        response.status(201).json(chatId)
    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}

export const addGroupChatParticipantController = async (request, response) => {
    try {

        if (!validateAddGroupChatParticipantParams(request.body)) return response.status(400).send("Invalid parameters!")

        const { chatId, participantUsername } = request.body
        const token = request.headers.authorization

        const user = await getUserFromJWTService(token)
        const participant = await getUserFromUsernameService(participantUsername)

        const chat = await getChatFromIdService(chatId)

        if (!user || !participant) return response.status(404).send("User or users not found.")

        if (!chat) return response.status(404).send("Chat not found.")

        if (!chat.isGroup) return response.status(403).send("Can't add participants to private chat!")

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id)
        const participantIsChatParticipant = await getUserIsChatParticipantService(participant.id, chat.id)
        const userIsChatCreator = await getUserIsChatCreatorService(user.id, chat.id)

        if (!userIsChatParticipant || !userIsChatCreator) return response.status(403).send("You can't add participants!")

        if (participantIsChatParticipant) return response.status(403).send("User is already chat participant.")

        await addGroupChatParticipantService(chat, participant)

        await updateChatLastOpenedByUserService(user.id, chat.id)

        response.status(201).json(participant.id)

    } catch (_error) {
        response.status.send("Something went wrong! Try again later.")
    }
}

export const removeChatParticipantController = async (request, response) => {
    try {

        if (!validateRemoveChatParticipantParams(request.body)) return response.status(400).send("Invalid parameters!")

        const { chatId, participantId } = request.body
        const token = request.headers.authorization

        const user = await getUserFromJWTService(token)
        const chat = await getChatFromIdService(chatId)
        const participant = await getUserFromIdService(participantId)

        if (!user || !participant) return response.status(404).send("User or chat not found.")

        if (user.id === participant.id && user.id === chat.creatorId) {
            return response.status(403).send("As a chat creator you can't leave chat, you have to delete chat.")
        }

        if (user.id !== participant.id && user.id !== chat.creatorId) {
            return response.status(401).send("Only chat creator can remove chat participants.")
        }

        await removeChatParticipantService(chat.id, participant.id)
        response.status(200).json({ chatId: chat.id, participantId: participant.id })

    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}

export const getUserChatsController = async (request, response) => {
    try {

        const token = request.headers.authorization
        const user = await getUserFromJWTService(token)

        if (!user) return response.status(404).send("User not found.")

        const chats = await getUserChatsService(user)

        response.status(200).json(chats)
    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}

export const deleteChatController = async (request, response) => {
    try {

        if (!validateDeleteChatParams(request.body)) return response.status(400).send("Invalid parameters!")

        const token = request.headers.authorization
        const { chatId } = request.body

        const user = await getUserFromJWTService(token)
        const chat = await getChatFromIdService(chatId)

        if (!user) return response.status(404).send("User not found.")
        if (!chat) return response.status(404).send("Chat not found.")
        if (chat.creatorId !== user.id) return response.status(403).send("Only chat creator can delete chat.")

        await deleteChatService(chat)

        response.status(200).send("Chat deleted.")
    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}

export const getUnreadMessagesInChatController = async (request, response) => {
    try {

        if (!validateGetUnreadMessagesInChatParams(request.query)) return response.status(400).send("Invalid parameters!")

        const token = request.headers.authorization
        const { chatId } = request.query
        const user = await getUserFromJWTService(token)
        const chat = await getChatFromIdService(chatId)

        if (!chat || !user) return response.status(404).send("Chat or user not found!")

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id)

        if (!userIsChatParticipant) return response.status(403).send("User is not chat participant!")

        const lastOpened = await getChatLastOpenedByUserService(chatId, user.id)
        const unreadMessagesAmount = await getUnreadMessagesAmountInChatService(chatId, lastOpened)
        
        response.status(200).json(unreadMessagesAmount)

    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}

export const updateUnreadMessagesInChatController = async (request, response) => {
    try {

        if (!validateUpdateUnreadMessagesInChatParams(request.body)) return response.status(400).send("Invalid parameters!")

        const token = request.headers.authorization
        const { chatId } = request.body
        const user = await getUserFromJWTService(token)
        const chat = await getChatFromIdService(chatId)

        if (!chat || !user) return response.status(404).send("Chat or user not found!")

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id)

        if (!userIsChatParticipant) return response.status(403).send("User is not chat participant!")

        await updateChatLastOpenedByUserService(user.id, chat.id)
        response.status(200).send("Unread messages updated.")

    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}
