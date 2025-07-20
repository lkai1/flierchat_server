import { getUserFromJWTService } from "../services/userServices.ts";
import { validateCreateMessageParams, validateGetChatMessagesParams, validateDeleteAllUserMessagesFromChatParams, validateDeleteUserMessageParams } from "../utils/validation/messageValidation.ts";
import { getChatFromIdService, getUserIsChatParticipantService } from "../services/chatServices.ts";
import { createMessageService, deleteAllUserMessagesFromChatService, deleteUserMessageService, getMessageFromIdService, getMessagesFromChatService } from "../services/messageServices.ts";
import { Request, Response } from "express";

export const createMessageController = async (request: Request<object, object, { chatId: string, message: string }>, response: Response): Promise<void> => {
    try {

        if (!validateCreateMessageParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const { chatId, message } = request.body;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

        response.status(201).json(messageToSend);

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const getChatMessagesController = async (request: Request<object, object, object, { chatId: string }>, response: Response): Promise<void> => {
    try {

        if (!validateGetChatMessagesParams(request.query)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        const { chatId } = request.query;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

        const messages = await getMessagesFromChatService(chat);

        response.status(200).json(messages);

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const deleteAllUserMessagesFromChatController = async (request: Request<object, object, { chatId: string }>, response: Response): Promise<void> => {
    try {

        if (!validateDeleteAllUserMessagesFromChatParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const deleteUserMessageController = async (request: Request<object, object, { messageId: string }>, response: Response): Promise<void> => {
    try {

        if (!validateDeleteUserMessageParams(request.body)) {
            response.status(400).send("Invalid parameters!");
            return;
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};