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
    chatId: string,
    limit?: string,
    offset?: string
}): boolean => {

    const validKeys = ["chatId", "limit", "offset"];
    const hasInvalidKey = Object.keys(params).some((k) => { return !validKeys.includes(k); });
    if (hasInvalidKey) return false;

    if (typeof params.chatId !== "string" || !params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)) return false;

    if (params.limit !== undefined) {
        const limit = parseInt(params.limit);
        if (isNaN(limit) || limit < 1 || limit > 100) return false;
    }

    if (params.offset !== undefined) {
        const offset = parseInt(params.offset);
        if (isNaN(offset) || offset < 0) return false;
    }

    return true;
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

export const validateChatId = (chatId: string): boolean => {
    return Boolean(chatId
        && typeof chatId === "string"
        && chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};

export const validateMessage = (message: string): boolean => {
    return Boolean(message
        && typeof message === "string"
        && message.length <= 2000);
};

export const validateMessageId = (messageId: string): boolean => {
    return Boolean(messageId
        && typeof messageId === "string"
        && messageId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i));
};