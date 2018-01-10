import { ConnectionStatus } from "./connection-status";

export abstract class SessionStore {
    abstract get status(): ConnectionStatus;
    abstract saveToken(id: string, refresh_token: string): Promise<string>;
    abstract getToken(id: string): Promise<string>;
    abstract getNonce(id: string): Promise<string>;
    abstract deleteNonce(id: string): Promise<number>;
}