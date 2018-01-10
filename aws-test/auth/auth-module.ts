import { ReflectiveInjector, Injector } from "@angular/core";
import { Express } from "express";

// Config files
import { TwitchAccess } from "./twitch-auth-client";
import { RedisConfig } from "./redis-connection";
let twitch_access: TwitchAccess;
if (process.argv[2] === "testing") {
    twitch_access = require("../../server-config/twitch-access-local.json") as TwitchAccess;
}
else {
    twitch_access = require("../../server-config/twitch-access-server.json") as TwitchAccess;
}
const redis_config = require("../../server-config/redis-config.json") as RedisConfig;

// Services
import { AuthRoutes } from "./auth-routes";
import { SecretProvider } from "./secret-provider";
import { RouteTokenService } from "./route-token-service";
import { RedisConnection } from "./redis-connection";
import { SessionStore } from "./session-store";
import { RedisClient } from "./redis-client";
import { TwitchAuthClient } from "./twitch-auth-client";
import { TwitchTokenService } from "./twitch-token-service";

// Testing
import { MockRedisConnection } from "../test/mock-redis-connection";

export async function AuthModule (root_injector: ReflectiveInjector, app: Express) {
    let injector: Injector = root_injector.resolveAndCreateChild([
        AuthRoutes,
        SecretProvider,
        RouteTokenService,
        { provide: RedisConnection, useClass: (process.argv[2] === "testing") ? MockRedisConnection : RedisConnection},
        TwitchAuthClient,
        TwitchTokenService,
        { provide: SessionStore, useClass: RedisClient },
        { provide: TwitchAccess, useValue: twitch_access },
        { provide: RedisConfig, useValue: redis_config }
    ]);

    await (<SecretProvider>injector.get(SecretProvider)).initialise();
    await (<TwitchTokenService>injector.get(TwitchTokenService)).getPublicKeyCert();

    let routes = injector.get(AuthRoutes);
    app.use(routes.initialiseRoutes());

    return injector as ReflectiveInjector;
}