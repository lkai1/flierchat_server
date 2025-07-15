import bcrypt from "bcryptjs"
import db from '../database/db.js'
import jwt from "jsonwebtoken"
import env_vars from "../config/environment_variables.js"
import { validateRegisterParams, validateLoginParams } from "../utils/validation/authValidation.js"
import createPasswordHash from "../utils/createPasswordHash.js"
import { createUserService, getUsernameExistsService } from "../services/userServices.js"

export const registerController = async (request, response) => {
  try {

    if (!validateRegisterParams(request.body)) return response.status(400).send("Invalid register credentials!")

    const { username, password } = request.body

    const usernameExists = await getUsernameExistsService(username)
    if (usernameExists) return response.status(403).send("Username is already taken.")

    const hash = await createPasswordHash(password)

    await createUserService(username, hash)

    response.status(201).send("User registered!")

  } catch (_error) {
    response.status(500).send("Something went wrong! Try again later.")
  }
}

export const loginController = async (request, response) => {
  try {

    if (!validateLoginParams(request.body)) return response.status(400).send("Invalid login credentials!")

    const { username, password } = request.body

    const user = await db.users.findOne({ where: { username } })
    if (!user) return response.status(400).send("Invalid login credentials!")

    const validPassword = await bcrypt.compare(password, user.hash)
    if (!validPassword) return response.status(400).send("Invalid login credentials!")

    const token = jwt.sign({ id: user.id }, env_vars.TOKEN_SECRET)

    response
      .cookie("auth_token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 1000 * 60 * 60 * 24,
      })
      .status(200)
      .send("User logged in.")

  } catch {
    response.status(500).send("Something went wrong! Try again later.")
  }
}

export const verifyLoginController = async (request, response) => {
  try {
    const token = request.cookies.auth_token;
    if (!token) return response.status(401).send("Access denied!")

    try {
      jwt.verify(token, env_vars.TOKEN_SECRET)
      response.status(200).send("Verified login!")
    } catch {
      response.clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      }).status(400).send("Invalid token!")
    }
  } catch {
    response.clearCookie('auth_token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
    }).status(500).send("Something went wrong! Try again later.")
  }
}

export const logoutController = async (_request, response) => {
  try {
    response
      .clearCookie('auth_token', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
      })
      .status(200)
      .send('Logged out');
  } catch (_error) {
    response.status(500).send("Something went wrong! Try again later.")
  }
}
