import db from "../database/db";
import jwt from "jsonwebtoken";
import { deleteChatService, getChatsCreatedByUserService } from "./chatServices";
import { UserModel } from "../types";

export const getUserFromJWTService = async (token: string): Promise<UserModel | null> => {
    //return should be different from UserModel if returning only id and username
    const decodedJWT = jwt.decode(token);
    if (typeof decodedJWT !== "object" || decodedJWT === null || typeof decodedJWT.id !== "string") { return null; }
    const user = await db.users.findOne({ where: { id: decodedJWT.id }, attributes: ["id", "username"] });
    return user;
};

export const getUserFromUsernameService = async (username: string): Promise<UserModel | null> => {
    const user = await db.users.findOne({ where: { username }, attributes: ["id", "username"] });
    return user;
};

export const getUserFromIdService = async (id: string): Promise<UserModel | null> => {
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