/* eslint-disable no-unused-vars */
import "socket.io";
/* remove selectedchat from backend when you are done with notifications */
declare module "socket.io" {
    interface Socket {
        token: string;
        userId: string;
        selectedChat?: string;
    }

    interface RemoteSocket {
        token: string;
        userId: string;
        selectedChat?: string;
    }
}
