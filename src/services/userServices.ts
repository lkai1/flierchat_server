import db from "../database/db.js";
import jwt from "jsonwebtoken";
import { deleteChatService, getChatsCreatedByUserService } from "./chatServices.js";
import { UserModel, UserModelWithIdAndUsername } from "../types.js";
import env_vars from "../config/environment_variables.js";

export const getUserFromJWTService = async (token: string): Promise<UserModelWithIdAndUsername | null> => {
    if (typeof env_vars.TOKEN_SECRET !== "string" || env_vars.TOKEN_SECRET.length === 0) { return null; }

    const decodedJWT = jwt.verify(token, env_vars.TOKEN_SECRET, { algorithms: ['HS256'] });

    if (typeof decodedJWT !== "object" || decodedJWT === null || typeof decodedJWT.id !== "string") { return null; }

    const user = await db.users.findOne({ where: { id: decodedJWT.id }, attributes: ["id", "username"] });
    return user;
};

export const getUserFromUsernameService = async (username: string): Promise<UserModelWithIdAndUsername | null> => {
    const user = await db.users.findOne({ where: { username }, attributes: ["id", "username"] });
    return user;
};

export const getUserFromIdService = async (id: string): Promise<UserModelWithIdAndUsername | null> => {
    const user = await db.users.findOne({ where: { id }, attributes: ["id", "username"] });
    return user;
};

export const createUserService = async (username: string, hash: string): Promise<UserModel> => {
    const user = await db.users.create({ username, hash });
    return user;
};

export const getUsernameExistsService = async (username: string): Promise<boolean> => {
    return Boolean(await db.users.findOne({ where: { username } }));
};

export const deleteUserService = async (userId: string): Promise<void> => {
    await db.messages.destroy({ where: { creatorId: userId } });
    const chatsCreatedByUser = await getChatsCreatedByUserService(userId);

    for (const chat of chatsCreatedByUser) {
        await deleteChatService(chat);
    }

    await db.chatParticipants.destroy({ where: { userId } });
    await db.users.destroy({ where: { id: userId } });
};