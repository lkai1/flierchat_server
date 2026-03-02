import { Server } from "socket.io";
import { UserModelWithIdAndUsername } from "../../types.js";
import { getAllUniqueSocketIdsInUserRooms } from "./getSocketFunctions.js";

export const emitToAllUniqueOnlineSocketsInUserRooms = async (value: any, emitType: string, io: Server, user: UserModelWithIdAndUsername) => {
    const uniqueSocketIdsInUserRooms = await getAllUniqueSocketIdsInUserRooms(user.id, io)

    uniqueSocketIdsInUserRooms.forEach((id) => {
        io.to(id).emit(emitType, value);
    });
}
