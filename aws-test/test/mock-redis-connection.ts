import { Observable } from "rxjs/Observable";
import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Injectable } from "@angular/core";
import { ConnectionStatus } from "../auth/connection-status";

class MockRedisClient {
    database = new Map<string, string>();

    set(key: string, value: string, callback: (err: Error | null, reply: "OK") => void) {
        this.database.set(key, value);
        callback(null, "OK");
    };

    get(key: string, callback: (err: Error | null, reply: string) => void) {
        callback(null, this.database.get(key));
    };

    del(key: string, callback: (err: Error | null, reply: number) => void) {
        callback(null, +this.database.delete(key));
    };
}

@Injectable()
export class MockRedisConnection {

    get status(): ConnectionStatus {
        return ConnectionStatus.connect;
    };

    get client() {
        return this.client_;
    };

    private client_: MockRedisClient;
    private status_: BehaviorSubject<ConnectionStatus>;

    constructor() {
        this.client_ = new MockRedisClient();
        this.status_ = new BehaviorSubject<ConnectionStatus>(ConnectionStatus.unitialised);
    };

    connectRedisClient() {
        this.status_.next(ConnectionStatus.connect);
        return this.status_.asObservable();
    };

    closeConnection(force = false) { };
}