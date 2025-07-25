import { DataTypes, Sequelize, ModelStatic } from 'sequelize';
import { ChatModel } from '../../types.js';

const Chat = (sequelize: Sequelize): ModelStatic<ChatModel> => {
    return sequelize.define<ChatModel>('Chat', {
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
        },
        creatorId: {
            type: DataTypes.UUID,
            allowNull: false
        },
    }, {
        timestamps: false
    });
};

export default Chat;
