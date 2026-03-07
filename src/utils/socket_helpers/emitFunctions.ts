import { Server } from "socket.io";
import { UserIdAndUsername } from "../../types.js";
import { getAllUniqueSocketIdsInUserRooms } from "./getSocketFunctions.js";

export const emitToAllUniqueOnlineSocketsInUserRooms = async (value: any, emitType: string, io: Server, user: UserIdAndUsername) => {
    const uniqueSocketIdsInUserRooms = await getAllUniqueSocketIdsInUserRooms(user.id, io)

    uniqueSocketIdsInUserRooms.forEach((id) => {
        io.to(id).emit(emitType, value);
    });
}
