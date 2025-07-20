
export const validateCreatePrivateChatParams = (params: {
    participantUsername: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.participantUsername === "string"
        && params.participantUsername.length > 2 && params.participantUsername.length < 31);
};

export const validateCreateGroupChatParams = (params: {
    chatName: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.chatName === "string"
        && params.chatName.length > 2 && params.chatName.length < 31);
};

export const validateAddGroupChatParticipantParams = (params: {
    chatId: string,
    participantUsername: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 2
        && typeof params.chatId === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
        && typeof params.participantUsername === "string"
        && params.participantUsername.length > 2 && params.participantUsername.length < 31);
};

export const validateRemoveChatParticipantParams = (params: {
    chatId: string,
    participantId: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 2
        && typeof params.chatId === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
        && typeof params.participantId === "string"
        && params.participantId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};

export const validateDeleteChatParams = (params: {
    chatId: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.chatId === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};

export const validateGetUnreadMessagesInChatParams = (params: {
    chatId: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.chatId === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};

export const validateUpdateUnreadMessagesInChatParams = (params: {
    chatId: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.chatId === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};