import { DataTypes, ModelStatic, Sequelize } from "sequelize";
import { ChatParticipantModel } from "../../types";

const ChatParticipant = (sequelize: Sequelize): ModelStatic<ChatParticipantModel> => {
    return sequelize.define<ChatParticipantModel>("ChatParticipant", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
            primaryKey: true
        },
        lastOpened: {
            type: DataTypes.STRING,
            allowNull: true
        },
        userId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        chatId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    }, { timestamps: false });
};

export default ChatParticipant;
