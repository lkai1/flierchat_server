import { DataTypes, ModelStatic, Sequelize } from "sequelize";
import { MessageModel } from "../../types";


const Message = (sequelize: Sequelize): ModelStatic<MessageModel> => {
    return sequelize.define<MessageModel>("Message", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
            primaryKey: true
        },
        value: {
            type: DataTypes.TEXT,
            allowNull: false
        },
        timestamp: {
            type: DataTypes.STRING,
            allowNull: false
        },
        creatorId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
        chatId: {
            type: DataTypes.UUID,
            allowNull: false,
        },
    }, {
        timestamps: false
    });
};

export default Message;