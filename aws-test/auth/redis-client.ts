import { Injectable } from "@angular/core";

import { SessionStore } from "./session-store";
import { RedisConnection } from "./redis-connection";

@Injectable()
export class RedisClient implements SessionStore {

    get status() {
        return this.redis_connection_.status;
    };

    constructor(private redis_connection_: RedisConnection) { };

    saveToken(id: string, refresh_token: string) {
        // Store id: access#refresh
        // let token_str = tokens.access_token + "#" + tokens.refresh_token;
        return new Promise<string>((resolve, reject) => {
            this.redis_connection_.client.set(id, refresh_token, (err, reply) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(reply);
                }
            });
        });
    };


    getToken(id: string) {
        return new Promise<string>((resolve, reject) => {
            this.redis_connection_.client.get(id, (err, token) => {
                if (err) {
                    reject(err);
                }
                else {
                    //let array = reply.split("#");
                    //let tokens: Tokens = { access_token: array[0], refresh_token: array[1] };
                    //resolve(tokens);
                    resolve(token);
                }
            });
        });
    };

    getNonce(state: string) {
        return new Promise<string>((resolve, reject) => {
            this.redis_connection_.client.get(state, (err, reply) => {
                if (err) {
                    reject(err);
                }
                else {
                    resolve(reply);
                }
            });
        });
    };

    deleteNonce(state: string) {
        return new Promise<number>((resolve, reject) => {
            this.redis_connection_.client.del(state, (err, reply) => {
                if (err) {
                    return reject(err);
                }
                resolve(reply);
            });
        });
    };
}