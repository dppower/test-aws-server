import path = require("path");
import body_parser = require("body-parser");
import cookie_parser = require("cookie-parser");
import express = require("express");

const app = express();

// common middleware
app.use(body_parser.urlencoded({ extended: false }));
app.use(body_parser.json());
app.use(cookie_parser());

// static routes
let testing = process.argv[2] === "testing";
let script_path = testing ? path.join(__dirname, "..", "node_modules") : path.join(__dirname, "node_modules");
app.use("/static", express.static(path.join(__dirname, "..", "static")));
app.use("/scripts", express.static(script_path));
app.use("/app", express.static(path.join(__dirname, "app")));

// rxjs
import "./rxjs-extensions";
// Dependency injection
import "reflect-metadata";
import { ReflectiveInjector, Injector, InjectionToken } from "@angular/core";

import { AuthModule } from "./auth/auth-module";
import { RedisConnection } from "./auth/redis-connection";
import { AuthRoutes } from "./auth/auth-routes";

import { LevelDataModule } from "./level-data/level-data-module";
import { LevelTimesModule } from "./level-times/level-times-module";
import { LevelNotesModule } from "./level-notes/level-notes-module";
import { LevelVotesModule } from "./level-votes/level-votes-module";

import { DynamoDbModule } from "./aws-common/dynamodb-module";

let redis_connection: RedisConnection;

const root_injector = ReflectiveInjector.resolveAndCreate([]);

let injectors = new Map<string, ReflectiveInjector>();
injectors.set("root_injector", root_injector);

async function initialiseModules(): Promise<Map<string, Injector>> {
    injectors.set("auth_injector", await AuthModule(root_injector, app));
    injectors.set("db_injector", await DynamoDbModule(injectors.get("auth_injector")));

    injectors.set("level_data_injector", await LevelDataModule(injectors.get("db_injector"), app));
    injectors.set("level_times_injector", await LevelTimesModule(injectors.get("db_injector"), app));
    injectors.set("level_notes_injector", await LevelNotesModule(injectors.get("db_injector"), app));
    injectors.set("level_votes_injector", await LevelVotesModule(injectors.get("db_injector"), app));

    return injectors;
}

initialiseModules().then((injectors) => {
    redis_connection = injectors.get("auth_injector").get(RedisConnection);
    redis_connection.connectRedisClient().subscribe(
        (next) => {
            if (next === "connect") {
                app.listen(3000, () => {
                    if (!testing) {
                        process.send("ready"); //=> pm2 will set the app as ready
                    }
                });
            }
        }, (err: any) => {
            console.log(`redis connection error: ${err.message}.`);
        }, () => {
            console.log(`redis connection closed.`);
            process.exit(1);
        }
    );
}, (err: any) => {
    console.log(`module initialisation error: ${err.message || err.code}.`);
    process.exit(1);
});

app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "..", "static", "index.html"));
});

process.on("uncaughtException", (err: Error) => {
    console.log(`Uncaught Exception: ${err.stack}.`);
    process.exit(1);
});

process.on("SIGINT", () => {
    process.exit(1);
});

process.on("exit", (code) => {
    // Do cleanup here
    redis_connection.closeConnection(true);
});
