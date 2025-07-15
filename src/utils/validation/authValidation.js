
const validateUsername = (username) => {
    return (
        username
        && typeof username === "string"
        && username.match(/^[0-9a-zA-Z]{3,20}$/)
    ) ? true : false
}

const validatePassword = (password) => {
    return (
        password
        && typeof password === "string"
        && password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,30}$/)
    ) ? true : false
}

export const validateRegisterParams = (params) => {
    return (
        params
        && typeof params === "object"
        && Object.keys(params).length === 3
        && validateUsername(params.username)
        && validatePassword(params.password)
        && params.password === params.password2
    ) ? true : false
}

export const validateLoginParams = (params) => {
    return (
        params
        && typeof params === "object"
        && Object.keys(params).length === 2
        && validateUsername(params.username)
        && validatePassword(params.password)
    ) ? true : false
}