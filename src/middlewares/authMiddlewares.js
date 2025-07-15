import jwt from "jsonwebtoken"
import env_vars from "../config/environment_variables.js"

export const verifyJWTMiddleware = async (request, response, next) => {
    try {
        const token = request.headers.authorization
        if (!token) return response.status(401).send("Access denied!")

        try {
            jwt.verify(token, env_vars.TOKEN_SECRET)
            next()
        } catch (e) {
            response.status(400).send("Invalid token!")
        }

    } catch (_error) {
        response.status(500).send("Something went wrong! Try again later.")
    }
}