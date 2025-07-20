/* eslint-disable no-unused-vars */
import "socket.io";

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
