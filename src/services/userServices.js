import db from "../database/db.js"
import jwt from "jsonwebtoken"
import { deleteChatService, getChatsCreatedByUserService } from "./chatServices.js"

export const getUserFromJWTService = async (token) => {
    const decodedJWT = jwt.decode(token)
    return await db.users.findOne({ where: { id: decodedJWT.id }, attributes: ["id", "username"] })
}

export const getUserFromUsernameService = async (username) => {
    return await db.users.findOne({ where: { username }, attributes: ["id", "username"] })
}

export const getUserFromIdService = async (id) => {
    return await db.users.findOne({ where: { id }, attributes: ["id", "username"] })
}

export const createUserService = async (username, hash) => {
    return await db.users.create({ username, hash })
}

export const getUsernameExistsService = async (username) => {
    return await db.users.findOne({ where: { username } }) ? true : false
}

export const deleteUserService = async (userId) => {
    await db.messages.destroy({ where: { creatorId: userId } })
    const chatsCreatedByUser = await getChatsCreatedByUserService(userId)

    for (const chat of chatsCreatedByUser) {
        await deleteChatService(chat)
    }

    await db.chatParticipants.destroy({ where: { userId } })
    await db.users.destroy({ where: { id: userId } })

}