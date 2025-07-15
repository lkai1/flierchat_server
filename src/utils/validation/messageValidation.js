
export const validateCreateMessageParams = (params) => {
    return (
        params
        && typeof params === "object"
        && Object.keys(params).length === 2
        && typeof params.chatId === "string"
        && typeof params.message === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
    ) ? true : false
}

export const validateGetChatMessagesParams = (params) => {
    return (
        params
        && typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.chatId === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
    ) ? true : false
}

export const validateDeleteAllUserMessagesFromChatParams = (params) => {
    return (
        params
        && typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.chatId === "string"
        && params.chatId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
    ) ? true : false
}

export const validateDeleteUserMessageParams = (params) => {
    return (
        params
        && typeof params === "object"
        && Object.keys(params).length === 1
        && typeof params.messageId === "string"
        && params.messageId.match(/^[0-9A-F]{8}-[0-9A-F]{4}-[4][0-9A-F]{3}-[89AB][0-9A-F]{3}-[0-9A-F]{12}$/i)
    ) ? true : false
}