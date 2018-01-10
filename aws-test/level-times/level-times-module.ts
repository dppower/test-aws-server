import { Express } from "express";
import { ReflectiveInjector, Injector } from "@angular/core";

// Routes
import { LevelTimesRoutes } from "./level-times-routes";

// Services
import { DynamoService } from "../aws-common/dynamo-service";

// Tokens
import { table_name, primary_key, sort_key } from "../aws-common/db-tokens";

// Testing

export async function LevelTimesModule(root_injector: ReflectiveInjector, app: Express) {
    let injector: Injector = root_injector.resolveAndCreateChild([
        DynamoService,
        LevelTimesRoutes,
        { provide: table_name, useValue: "level_times" },
        { provide: primary_key, useValue: "level_id" },
        { provide: sort_key, useValue: "player_id" }
    ]);

    let routes = injector.get(LevelTimesRoutes);
    app.use(routes.initialiseRoutes());
    return injector as ReflectiveInjector;
}