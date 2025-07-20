/* eslint-disable no-unused-vars */
import { CreationOptional, HasManyGetAssociationsMixin, InferAttributes, InferCreationAttributes, Model, NonAttribute } from "sequelize";

export interface ChatCreationAttributes {
    chatName?: string;
    isGroup: boolean;
}

export interface ChatWithParticipants {
    id: string;
    chatName: string | null;
    isGroup: boolean;
    chatParticipants: {
        id: string;
        username: string;
    }[];
}

export interface ChatWithParticipantIds {
    id: string;
    chatName: string | null;
    isGroup: boolean;
    chatParticipants: {
        id: string;
    }[];
}

export interface ChatParticipantAttributes {
    id: string;
    lastOpened: string | null;
    userId: string;
    chatId: string;
}

export interface ChatParticipantCreationAttributes {
    lastOpened?: string;
}



export interface UserModel extends Model<InferAttributes<UserModel>, InferCreationAttributes<UserModel>> {
    id: CreationOptional<string>;
    username: string;
    hash: string;
    createUserChat(params: ChatCreationAttributes): Promise<ChatModel>;
}

export interface ChatModel extends Model<InferAttributes<ChatModel>, InferCreationAttributes<ChatModel>> {
    id: CreationOptional<string>;
    chatName: string | null;
    isGroup: boolean;
    addChatParticipants(params: UserModel[]): Promise<ChatParticipantModel>;
    getChatParticipants: HasManyGetAssociationsMixin<UserModel>;
    getChatMessages: HasManyGetAssociationsMixin<MessageModel>;
    chatParticipants?: NonAttribute<UserModel[]>;
    creatorId: string;
}

export interface ChatParticipantModel extends Model<InferAttributes<ChatParticipantModel>, InferCreationAttributes<ChatParticipantModel>> {
    id: CreationOptional<string>;
    lastOpened: string | null;
    userId: string;
    chatId: string;
}

export interface MessageModel extends Model<InferAttributes<MessageModel>, InferCreationAttributes<MessageModel>> {
    id: CreationOptional<string>;
    value: string;
    timestamp: string;
    creatorId: string;
    chatId: string;
    messageCreator?: {
        id: string;
        username: string;
    };
}

export interface MessageWithCreator {
    id: string;
    value: string;
    timestamp: string;
    chatId: string;
    creatorId: string;
    messageCreator: {
        id: string;
        username: string;
    };
}