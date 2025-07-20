import { DataTypes, ModelStatic, Sequelize } from "sequelize";
import { UserModel } from "../../types";

const User = (sequelize: Sequelize): ModelStatic<UserModel> => {
    return sequelize.define<UserModel>("User", {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            unique: true,
            primaryKey: true
        },
        username: {
            type: DataTypes.STRING,
            unique: true,
            allowNull: false
        },
        hash: {
            type: DataTypes.STRING,
            allowNull: false
        }
    }, {
        timestamps: false
    });
};

export default User;