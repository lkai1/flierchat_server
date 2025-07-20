import jwt from "jsonwebtoken";
import env_vars from "../config/environment_variables.ts";
import { NextFunction, Request, Response } from "express";

export const verifyJWTMiddleware = (request: Request, response: Response, next: NextFunction): void => {
    try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        if (typeof env_vars.TOKEN_SECRET !== "string" || env_vars.TOKEN_SECRET.length === 0) {
            response.status(500).send("Something went wrong! Try again later.");
            return;
        }

        try {
            jwt.verify(token, env_vars.TOKEN_SECRET);
            next();
        } catch {
            response.status(400).send("Invalid token!");
        }

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};