
export const validateCreateMessageParams = (params: {
    chatId: string,
    message: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 2
        && typeof params.chatId === "string"
        && typeof params.message === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};

export const validateGetChatMessagesParams = (params: {
    chatId: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.chatId === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};

export const validateDeleteAllUserMessagesFromChatParams = (params: {
    chatId: string
}): boolean => {
    return Boolean(typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.chatId === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};

export const validateDeleteUserMessageParams = (params: {
    messageId: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.messageId === "string"
        && params.messageId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};