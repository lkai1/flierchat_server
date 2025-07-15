import { Sequelize } from "sequelize"
import env_vars from '../config/environment_variables.js'
import User from "./models/User.js"
import Chat from "./models/Chat.js"
import ChatParticipant from "./models/ChatParticipant.js"
import Message from "./models/Message.js"

const sequelize = new Sequelize(`${env_vars.DATABASE_CONNECTION_STRING}`, { logging: false })

const db = {}

db.sequelize = sequelize

db.users = User(sequelize)
db.chats = Chat(sequelize)
db.chatParticipants = ChatParticipant(sequelize)
db.messages = Message(sequelize)

db.users.hasMany(db.chats, { foreignKey: "creatorId", as: "userChats" })
db.chats.belongsTo(db.users, { foreignKey: "creatorId", as: "chatCreator" })

db.users.belongsToMany(db.chats, { through: db.chatParticipants, foreignKey: "userId", as: "participantChats" })
db.users.hasMany(db.chatParticipants, { foreignKey: "userId" })
db.chats.belongsToMany(db.users, { through: db.chatParticipants, foreignKey: "chatId", as: "chatParticipants" })
db.chats.hasMany(db.chatParticipants, { foreignKey: "chatId" })
db.chatParticipants.belongsTo(db.chats, { foreignKey: "chatId" })
db.chatParticipants.belongsTo(db.users, { foreignKey: "userId" })

db.users.hasMany(db.messages, { foreignKey: "creatorId", as: "userMessages" })
db.chats.hasMany(db.messages, { foreignKey: "chatId", as: "chatMessages" })
db.messages.belongsTo(db.users, { foreignKey: "creatorId", as: "messageCreator" })
db.messages.belongsTo(db.chats, { foreignKey: "chatId", as: "messageChat" })


export default db

