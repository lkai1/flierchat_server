import { Server } from "socket.io";
import { UserModelWithIdAndUsername } from "../../types";
import { getAllUniqueSocketIdsInUserRooms } from "./getSocketFunctions";

export const emitToAllUniqueOnlineSocketsInUserRooms = async (value: any, emitType: string, io: Server, user: UserModelWithIdAndUsername) => {
    const uniqueSocketIdsInUserRooms = await getAllUniqueSocketIdsInUserRooms(user.id, io)

    uniqueSocketIdsInUserRooms.forEach((id) => {
        io.to(id).emit(emitType, value);
    });
}
