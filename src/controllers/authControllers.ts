import bcrypt from "bcryptjs";
import db from '../database/db.js';
import jwt from "jsonwebtoken";
import env_vars from "../config/environment_variables.js";
import { validateRegisterParams, validateLoginParams } from "../utils/validation/authValidation.js";
import createPasswordHash from "../utils/createPasswordHash.js";
import { createUserService, getUsernameExistsService } from "../services/userServices.js";
import { Request, Response } from "express";

export const registerController = async (request: Request<object, object, { username: string, password: string, password2: string }>, response: Response): Promise<void> => {
  try {

    if (!validateRegisterParams(request.body)) {
      response.status(400).send("Invalid register credentials!");
      return;
    }

    const { username, password } = request.body;

    const usernameExists = await getUsernameExistsService(username);
    if (usernameExists) {
      response.status(403).send("Username is already taken.");
      return;
    }

    const hash = await createPasswordHash(password);

    await createUserService(username, hash);

    response.status(201).send("User registered!");

  } catch (error) {
    console.error("Error in registerController", error);
    response.status(500).send("Something went wrong! Try again later.");
  }
};

export const loginController = async (request: Request<object, object, { username: string, password: string }>, response: Response): Promise<void> => {
  try {

    if (!validateLoginParams(request.body)) {
      response.status(400).send("Invalid login credentials!");
      return;
    }

    const { username, password } = request.body;

    const user = await db.users.findOne({ where: { username } });
    if (!user) {
      response.status(400).send("Invalid login credentials!");
      return;
    }

    const validPassword = await bcrypt.compare(password, user.hash);
    if (!validPassword) {
      response.status(400).send("Invalid login credentials!");
      return;
    }

    if (typeof env_vars.TOKEN_SECRET !== "string" || env_vars.TOKEN_SECRET.length === 0) {
      response.status(500).send("Something went wrong! Try again later.");
      return;
    }

    const token = jwt.sign({ id: user.id }, env_vars.TOKEN_SECRET);

    response
      .cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
        maxAge: 1000 * 60 * 60 * 24,
      })
      .status(200).send("User logged in.");

  } catch (error) {
    console.error("Error in loginController", error);
    response.status(500).send("Something went wrong! Try again later.");
  }
};

export const verifyLoginController = (request: Request, response: Response): void => {
  try {
    const token = request.cookies.auth_token;

    if (typeof token !== "string" || token.length === 0) {
      response.status(401).send("Access denied!");
      return;
    }

    try {
      if (typeof env_vars.TOKEN_SECRET !== "string" || env_vars.TOKEN_SECRET.length === 0) {
        response.status(500).send("Something went wrong! Try again later.");
        return;
      }

      jwt.verify(token, env_vars.TOKEN_SECRET, { algorithms: ['HS256'] });
      response.status(200).send("Verified login!");
    } catch (error) {
      console.error("Error in verifyLoginController", error);
      response.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      }).status(400).send("Invalid token!");
    }
  } catch (error) {
    console.error("Error in verifyLoginController", error);
    response.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    }).status(500).send("Something went wrong! Try again later.");
  }
};

export const logoutController = (_request: Request, response: Response): void => {
  try {
    response
      .clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      })
      .status(200)
      .send('Logged out');
  } catch (error) {
    console.error("Error in logoutController", error);
    response.status(500).send("Something went wrong! Try again later.");
  }
};
