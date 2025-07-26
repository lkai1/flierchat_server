import {
    validateCreatePrivateChatParams,
    validateCreateGroupChatParams,
    validateAddGroupChatParticipantParams,
    validateRemoveChatParticipantParams,
    validateDeleteChatParams,
    validateGetUnreadMessagesInChatParams,
    validateUpdateUnreadMessagesInChatParams
} from "../utils/validation/chatValidation.js";
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
} from "../services/chatServices.js";
import { getUserFromIdService, getUserFromJWTService, getUserFromUsernameService } from "../services/userServices.js";
import { Request, Response } from "express";

export const createPrivateChatController = async (request: Request<object, object, { participantUsername: string }>, response: Response): Promise<void> => {
    try {

        if (!validateCreatePrivateChatParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const { participantUsername } = request.body;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const user = await getUserFromJWTService(token);

        const participant = await getUserFromUsernameService(participantUsername);

        if (!user || !participant) {
            response.status(404).send("User or users not found.");
            return;
        }

        if (user.id === participant.id) {
            response.status(403).send("Can't create a private chat with yourself!");
            return;
        }

        const privateChatBetweenUsers = await getPrivateChatBetweenUsersService(user.id, participant.id);

        if (privateChatBetweenUsers) {
            response.status(403).send("Private chat between these users already exists!");
            return;
        }

        const chatId = await createPrivateChatService(user, participant);

        await updateChatLastOpenedByUserService(user.id, chatId);
        await updateChatLastOpenedByUserService(participant.id, chatId);

        response.status(201).json(chatId);
    } catch (e) {
        console.log(e)
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const createGroupChatController = async (request: Request<object, object, { chatName: string }>, response: Response): Promise<void> => {
    try {

        if (!validateCreateGroupChatParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const { chatName } = request.body;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const user = await getUserFromJWTService(token);

        if (!user) {
            response.status(404).send("User not found.");
            return;
        }

        const chatNameExists = await getGroupChatNameExistsService(chatName);
        if (chatNameExists) {
            response.status(403).send("Group chat name is already taken.");
            return;
        }

        const chatId = await createGroupChatService(user, chatName);

        await updateChatLastOpenedByUserService(user.id, chatId);

        response.status(201).json(chatId);
    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const addGroupChatParticipantController = async (request: Request<object, object, { chatId: string, participantUsername: string }>, response: Response): Promise<void> => {
    try {

        if (!validateAddGroupChatParticipantParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const { chatId, participantUsername } = request.body;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const user = await getUserFromJWTService(token);
        const participant = await getUserFromUsernameService(participantUsername);

        const chat = await getChatFromIdService(chatId);

        if (!user || !participant) {
            response.status(404).send("User or users not found.");
            return;
        }

        if (!chat) {
            response.status(404).send("Chat not found.");
            return;
        }

        if (!chat.isGroup) {
            response.status(403).send("Can't add participants to private chat!");
            return;
        }

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id);
        const participantIsChatParticipant = await getUserIsChatParticipantService(participant.id, chat.id);
        const userIsChatCreator = await getUserIsChatCreatorService(user.id, chat.id);

        if (!userIsChatParticipant || !userIsChatCreator) {
            response.status(403).send("You can't add participants!");
            return;
        }

        if (participantIsChatParticipant) {
            response.status(403).send("User is already chat participant.");
            return;
        }

        await addGroupChatParticipantService(chat, participant);

        await updateChatLastOpenedByUserService(user.id, chat.id);

        response.status(201).json(participant.id);

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const removeChatParticipantController = async (request: Request<object, object, { chatId: string, participantId: string }>, response: Response): Promise<void> => {
    try {

        if (!validateRemoveChatParticipantParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const { chatId, participantId } = request.body;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const user = await getUserFromJWTService(token);
        const chat = await getChatFromIdService(chatId);
        const participant = await getUserFromIdService(participantId);

        if (!user || !participant || !chat) {
            response.status(404).send("User or chat not found.");
            return;
        }

        if (user.id === participant.id && user.id === chat.creatorId) {
            response.status(403).send("As a chat creator you can't leave chat, you have to delete chat.");
            return;
        }

        if (user.id !== participant.id && user.id !== chat.creatorId) {
            response.status(401).send("Only chat creator can remove chat participants.");
            return;
        }

        await removeChatParticipantService(chat.id, participant.id);
        response.status(200).json({ chatId: chat.id, participantId: participant.id });

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const getUserChatsController = async (request: Request, response: Response): Promise<void> => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const user = await getUserFromJWTService(token);

        if (!user) {
            response.status(404).send("User not found.");
            return;
        }

        const chats = await getUserChatsService(user.id);

        response.status(200).json(chats);
    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const deleteChatController = async (request: Request<object, object, { chatId: string }>, response: Response): Promise<void> => {
    try {

        if (!validateDeleteChatParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const { chatId } = request.body;

        const user = await getUserFromJWTService(token);
        const chat = await getChatFromIdService(chatId);

        if (!user) {
            response.status(404).send("User not found.");
            return;
        }
        if (!chat) {
            response.status(404).send("Chat not found.");
            return;
        }
        if (chat.creatorId !== user.id) {
            response.status(403).send("Only chat creator can delete chat.");
            return;
        }

        await deleteChatService(chat);

        response.status(200).send("Chat deleted.");
    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const getUnreadMessagesInChatController = async (request: Request<object, object, object, { chatId: string }>, response: Response): Promise<void> => {
    try {

        if (!validateGetUnreadMessagesInChatParams(request.query)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const { chatId } = request.query;
        const user = await getUserFromJWTService(token);
        const chat = await getChatFromIdService(chatId);

        if (!chat || !user) {
            response.status(404).send("Chat or user not found!");
            return;
        }

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id);

        if (!userIsChatParticipant) {
            response.status(403).send("User is not chat participant!");
            return;
        }

        const lastOpened = await getChatLastOpenedByUserService(chatId, user.id);

        const unreadMessagesAmount = await getUnreadMessagesAmountInChatService(chatId, lastOpened);

        response.status(200).json(unreadMessagesAmount);

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const updateUnreadMessagesInChatController = async (request: Request<object, object, { chatId: string }>, response: Response): Promise<void> => {
    try {

        if (!validateUpdateUnreadMessagesInChatParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const { chatId } = request.body;
        const user = await getUserFromJWTService(token);
        const chat = await getChatFromIdService(chatId);

        if (!chat || !user) {
            response.status(404).send("Chat or user not found!");
            return;
        }

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id);

        if (!userIsChatParticipant) {
            response.status(403).send("User is not chat participant!");
            return;
        }

        await updateChatLastOpenedByUserService(user.id, chat.id);
        response.status(200).send("Unread messages updated.");

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};
