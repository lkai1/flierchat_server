import { DataTypes } from "sequelize"

const Chat = (sequelize) => {
    return sequelize.define("Chat", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
            primaryKey: true
        },
        chatName: {
            type: DataTypes.STRING,
            allowNull: true
        },
        isGroup: {
            type: DataTypes.BOOLEAN,
            allowNull: false
        }
    }, {
        timestamps: false
    })
}

export default Chat