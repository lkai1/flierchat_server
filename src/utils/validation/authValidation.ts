
const validateUsername = (username: string): boolean => {
    return Boolean(username
        && typeof username === "string"
        && username.match(/^[0-9a-zA-Z]{3,20}$/));
};

const validatePassword = (password: string): boolean => {
    return Boolean(password
        && typeof password === "string"
        && password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/));
};

export const validateRegisterParams = (params: {
    username: string,
    password: string,
    password2: string
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 3
        && validateUsername(params.username)
        && validatePassword(params.password)
        && params.password === params.password2);
};

export const validateLoginParams = (params: {
    username: string,
    password: string,
}): boolean => {
    return Boolean(
        typeof params === "object"
        && Object.keys(params).length === 2
        && validateUsername(params.username)
        && validatePassword(params.password));
};