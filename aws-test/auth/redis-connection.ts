import { Injectable } from "@angular/core";

import redis = require("redis");
import { BehaviorSubject } from "rxjs/BehaviorSubject";

import { ConnectionStatus } from "./connection-status";

export class RedisConfig {
    endpoint: string;
    port: number;
}

@Injectable()
export class RedisConnection {

    get status() {
        return this.status_.getValue();
    };

    get client() {
        return this.client_;
    };

    private client_: redis.RedisClient;
    private status_: BehaviorSubject<ConnectionStatus>;

    constructor(private config_: RedisConfig) {
        this.status_ = new BehaviorSubject<ConnectionStatus>(ConnectionStatus.unitialised);
    };

    connectRedisClient() {

        this.client_ = redis.createClient(this.config_.port, this.config_.endpoint,
            { retry_strategy: this.redisRetryStrategy }
        );

        //=> Start handling authentication
        this.client_.on(ConnectionStatus.connect, () => {
            this.status_.next(ConnectionStatus.connect);
        });

        //=> Pause handling authentication
        this.client_.on(ConnectionStatus.reconnecting, () => {
            this.status_.next(ConnectionStatus.reconnecting);
        });

        //=> Log error
        this.client_.on(ConnectionStatus.error, (err: any) => {
            // Log errors
            this.status_.next(ConnectionStatus.error);
        });

        //=> Exit process
        this.client_.on(ConnectionStatus.end, () => {
            this.status_.next(ConnectionStatus.end);
        });

        return this.status_.asObservable();
    };

    private redisRetryStrategy: redis.RetryStrategy = (options) => {
        //if (options.error && options.error.name === 'ECONNREFUSED') {
        //    // End reconnecting on a specific error and flush all commands with
        //    // a individual error
        //    return new Error('The server refused the connection');
        //}
        //if (options.total_retry_time > 1000 * 60 * 60) {
        //    // End reconnecting after a specific timeout and flush all commands
        //    // with a individual error
        //    return new Error('Retry time exhausted');
        //}
        //if (options.attempt > 10) {
        //    // End reconnecting with built in error
        //    return;
        //}
        // reconnect after:
        return Math.min(options.attempt * 100, 3000);
    };

    closeConnection(force = false) {
        if (!this.client_) return;

        if (force) {
            this.client_.end();
        }
        else {
            this.client_.quit();
        }
    };
}