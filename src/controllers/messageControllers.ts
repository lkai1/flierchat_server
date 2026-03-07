import { getUserFromJWTService } from "../services/userServices.js";
import { validateCreateMessageParams, validateGetChatMessagesParams, validateDeleteAllUserMessagesFromChatParams, validateDeleteUserMessageParams } from "../utils/validation/messageValidation.js";
import { getChatFromIdService, getUserIsChatParticipantService, updateChatLastOpenedByUserService } from "../services/chatServices.js";
import { createMessageService, deleteAllUserMessagesFromChatService, deleteUserMessageService, getMessageFromIdService, getMessagesFromChatService } from "../services/messageServices.js";
import { Request, Response } from "express";

export const createMessageController = async (request: Request<object, object, { chatId: string, message: string }>, response: Response): Promise<void> => {
    try {
        if (!validateCreateMessageParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const { chatId, message } = request.body;
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const user = await getUserFromJWTService(token);
        const chat = await getChatFromIdService(chatId);

        if (!chat || !user) {
            response.status(404).send("Chat or user not found!");
            return;
        }

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id);

        if (!userIsChatParticipant) {
            response.status(401).send("Unauthorized!");
            return;
        }

        const messageToSend = await createMessageService(user.id, chat.id, message);
        await updateChatLastOpenedByUserService(user.id, chat.id);

        response.status(201).json(messageToSend);

    } catch (error) {
        console.error("Error in createMessageController", error);
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const getChatMessagesController = async (
    request: Request<object, object, object, { chatId: string, limit?: string, offset?: string }>,
    response: Response
): Promise<void> => {
    try {
        if (!validateGetChatMessagesParams(request.query)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const { chatId, limit: limitStr, offset: offsetStr } = request.query;
        const limit = limitStr ? Math.min(parseInt(limitStr), 100) : 50;
        const offset = offsetStr ? Math.max(parseInt(offsetStr), 0) : 0;

        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const user = await getUserFromJWTService(token);
        const chat = await getChatFromIdService(chatId);

        if (!chat || !user) {
            response.status(404).send("Chat or user not found!");
            return;
        }

        const userIsChatParticipant = await getUserIsChatParticipantService(user.id, chat.id);

        if (!userIsChatParticipant) {
            response.status(401).send("Unauthorized!");
            return;
        }

        const result = await getMessagesFromChatService(chat, limit, offset);

        response.status(200).json(result);

    } catch (error) {
        console.error("Error in getChatMessagesController", error);
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const deleteAllUserMessagesFromChatController = async (request: Request<object, object, { chatId: string }>, response: Response): Promise<void> => {
    try {
        if (!validateDeleteAllUserMessagesFromChatParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const token = request.cookies.auth_token;
        const { chatId } = request.body;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

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

        await deleteAllUserMessagesFromChatService(chat.id, user.id);

        response.status(200).send("All user messages deleted from chat.");

    } catch (error) {
        console.error("Error in deleteAllUserMessagesFromChatController", error);
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const deleteUserMessageController = async (request: Request<object, object, { messageId: string }>, response: Response): Promise<void> => {
    try {
        if (!validateDeleteUserMessageParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const token = request.cookies.auth_token;
        const { messageId } = request.body;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const user = await getUserFromJWTService(token);
        const message = await getMessageFromIdService(messageId);

        if (!message || !user) {
            response.status(404).send("Message or user not found!");
            return;
        }

        if (user.id !== message.creatorId) {
            response.status(403).send("You are not message creator!");
            return;
        }

        await deleteUserMessageService(message);

        response.status(200).send("Message deleted.");

    } catch (error) {
        console.error("Error in deleteUserMessageController", error);
        response.status(500).send("Something went wrong! Try again later.");
    }
};