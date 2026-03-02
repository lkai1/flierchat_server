import { RemoteSocket, Socket } from "socket.io";
import { getUserFromJWTService } from "../../services/userServices";
import cookie from "cookie";
import { UserModelWithIdAndUsername } from "../../types";


/* try to get rid of this type later because it bothers me */
interface EmitEvents {
    error(): void;
    onlineUsers(userIds: string[]): void; // eslint-disable-line no-unused-vars
}

export const verifySocketUserAndReturnUser = async (socket: Socket<object, EmitEvents> | RemoteSocket<EmitEvents, object>,): Promise<UserModelWithIdAndUsername | undefined> => {
    try {
        const rawCookie = socket.handshake.headers.cookie;
        const cookies = cookie.parse(rawCookie || "");
        const token = cookies.auth_token;

        if (typeof token !== "string" || token.length === 0) {
            socket.emit("error");
            return;
        }

        const user = await getUserFromJWTService(token);
        if (!user) {
            return;
        }

        return user;
    } catch (error) {
        console.error("Error in verifySocketUserAndReturnUser: ", error)
    }
}