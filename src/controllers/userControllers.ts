import { Request, Response } from "express";
import { deleteUserService, getUserFromJWTService } from "../services/userServices.js";

export const getUserInfoFromJWTController = async (request: Request, response: Response): Promise<void> => {
    try {

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        try {
            const user = await getUserFromJWTService(token);
            response.status(200).json(user);
        } catch {
            response.status(400).send("Invalid token!");
        }

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};

export const deleteUserController = async (request: Request, response: Response): Promise<void> => {
    try {

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const token = request.cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            response.status(401).send("Access denied!");
            return;
        }

        const user = await getUserFromJWTService(token);

        if (!user) {
            response.status(404).send("User not found.");
            return;
        }

        await deleteUserService(user.id);

        response.status(200).send("User deleted.");

    } catch {
        response.status(500).send("Something went wrong! Try again later.");
    }
};