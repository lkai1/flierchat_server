import db from "../database/db.js";
import { Op, where, col } from "sequelize";
import { UserModel, ChatParticipantModel, ChatModel, ChatWithParticipants, ChatWithParticipantIds } from "../types.js";

export const createPrivateChatService = async (user: UserModel, participant: UserModel): Promise<string> => {
    const chat = await user.createUserChat({
        isGroup: false
    });
    await chat.addChatParticipants([user, participant]);
    return chat.id;
};

export const createGroupChatService = async (user: UserModel, chatName: string): Promise<string> => {
    const chat = await user.createUserChat({
        isGroup: true,
        chatName,
    });
    await chat.addChatParticipants([user]);
    return chat.id;
};

//this is wrong return type. it doesnt include chatparticipants. or should it???
export const getPrivateChatBetweenUsersService = async (userId: string, userId2: string): Promise<InstanceType<typeof db.chats> | null> => {
    const chat = await db.chats.findOne({
        include: {
            model: db.chatParticipants,
            as: "ChatParticipants",
            duplicating: false,
            required: true
        },
        where: {
            isGroup: false,
            [Op.or]: [
                {
                    [Op.and]: [
                        where(col("Chat.creatorId"), userId),
                        where(col("ChatParticipants.userId"), userId2),
                    ],
                },
                {
                    [Op.and]: [
                        where(col("Chat.creatorId"), userId2),
                        where(col("ChatParticipants.userId"), userId),
                    ],
                }
            ]
        }
    });

    return chat;
};

export const getUserChatsService = async (userId: string): Promise<ChatWithParticipants[]> => {
    const chats = await db.chats.findAll({
        include: [
            {
                model: db.chatParticipants,
                where: { userId },
                attributes: [],
            },
            {
                model: db.users,
                as: "chatParticipants",
                attributes: ["id", "username"],
                through: { attributes: [] },
            },
        ],
    });

    const chatsWithParticipants = chats.map((chat) => {
        return {
            id: String(chat.id),
            chatName: chat.chatName ?? null,
            isGroup: chat.isGroup,
            creatorId: chat.creatorId,
            chatParticipants: chat.chatParticipants?.map((user) => {
                return {
                    id: String(user.id),
                    username: user.username,
                };
            }) ?? [],
        };
    });

    return chatsWithParticipants;
};

export const getIdsFromUserChatsService = async (userId: string): Promise<string[]> => {
    const chats = await db.chats.findAll({
        include: [
            {
                model: db.chatParticipants,
                where: { userId },
                attributes: []
            },
        ],
        attributes: ["id"], // fetch only the chat id
        raw: true
    });

    // chats is now an array of { id: ... }, so map to strings
    return chats.map((chat) => { return String(chat.id) });
};

export const getUserIsChatParticipantService = async (userId: string, chatId: string): Promise<boolean> => {
    return Boolean(await db.chatParticipants.findOne({
        where: {
            userId,
            chatId
        }
    }));
};

export const getChatParticipantService = async (userId: string, chatId: string): Promise<ChatParticipantModel | null> => {
    const chatParticipant = await db.chatParticipants.findOne({
        where: {
            userId,
            chatId
        }
    });

    return chatParticipant;
};

import { QueryTypes } from "sequelize";


export const getAllUnreadMessagesAmountForUserChatsService = async (
    userId: string
): Promise<{ chatId: string; amount: number }[]> => {

    const results = await db.sequelize.query(
        `
        SELECT 
            m."chatId",
            COUNT(m.id)::int AS amount
        FROM "Messages" m
        INNER JOIN "ChatParticipants" cp 
            ON cp."chatId" = m."chatId"
        WHERE 
            cp."userId" = :userId
            AND m."creatorId" != :userId
            AND m."timestamp" > cp."lastOpened"
        GROUP BY m."chatId"
        `,
        {
            replacements: { userId },
            type: QueryTypes.SELECT
        }
    );

    return results as { chatId: string; amount: number }[];
};

export const getChatLastOpenedByUserService = async (chatId: string, userId: string): Promise<string | null> => {
    const chatParticipant = await db.chatParticipants.findOne({
        where: { chatId, userId },
        attributes: ["lastOpened"]
    });
    if (!chatParticipant) { return null; }
    return chatParticipant.lastOpened;
};

export const updateChatLastOpenedByUserService = async (userId: string, chatId: string): Promise<void> => {
    const chatParticipant = await getChatParticipantService(userId, chatId);

    if (chatParticipant) {
        await chatParticipant.update({ lastOpened: new Date().toISOString() });
    }
};

export const getChatFromIdService = async (chatId: string): Promise<ChatModel | null> => {
    const chat = await db.chats.findOne({ where: { id: chatId } });
    return chat;
};

export const getChatWithParticipantIdsFromIdService = async (
    chatId: string
): Promise<ChatWithParticipantIds | null> => {
    const chat = await db.chats.findOne({
        where: { id: chatId },
        include: {
            model: db.users,
            as: "chatParticipants",
            attributes: ["id"],
            through: { attributes: [] },
        },
    });

    if (!chat) { return null; }

    return {
        id: String(chat.id),
        chatName: chat.chatName ?? null,
        isGroup: chat.isGroup,
        chatParticipants: chat.chatParticipants?.map((cp) => {
            return {
                id: String(cp.id),
            };
        }) ?? [],
    };
};

export const getGroupChatNameExistsService = async (chatName: string): Promise<boolean> => {
    return Boolean(await db.chats.findOne({ where: { chatName, isGroup: true } }));
};

export const getUserIsChatCreatorService = async (userId: string, chatId: string): Promise<boolean> => {
    return Boolean(await db.chats.findOne({
        where: {
            id: chatId,
            creatorId: userId
        }
    }));
};

export const getChatsCreatedByUserService = async (userId: string): Promise<ChatModel[]> => {
    const chats = await db.chats.findAll({
        where: { creatorId: userId }
    });
    return chats;
};

export const addGroupChatParticipantService = async (chat: ChatModel, participant: UserModel): Promise<void> => {
    await chat.addChatParticipants([participant]);
};

export const removeChatParticipantService = async (chatId: string, userId: string): Promise<void> => {
    await db.chatParticipants.destroy({ where: { chatId, userId } });
    await db.messages.destroy({ where: { chatId, creatorId: userId } });
};

export const deleteChatService = async (chat: ChatModel): Promise<void> => {
    await db.messages.destroy({ where: { chatId: chat.id } });
    await db.chatParticipants.destroy({ where: { chatId: chat.id } });
    await chat.destroy();
};