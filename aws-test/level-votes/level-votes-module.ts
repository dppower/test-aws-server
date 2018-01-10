import { Express } from "express";
import { ReflectiveInjector, Injector } from "@angular/core";

// Routes
import { LevelVotesRoutes } from "./level-votes-routes";

// Services
import { DynamoService } from "../aws-common/dynamo-service";

// Tokens
import { table_name, primary_key, sort_key } from "../aws-common/db-tokens";

// Testing

export async function LevelVotesModule(root_injector: ReflectiveInjector, app: Express) {
    let injector: Injector = root_injector.resolveAndCreateChild([
        DynamoService,
        LevelVotesRoutes,
        { provide: table_name, useValue: "level_votes" },
        { provide: primary_key, useValue: "level_id" },
        { provide: sort_key, useValue: "user_id" }
    ]);

    let routes = injector.get(LevelVotesRoutes);
    app.use(routes.initialiseRoutes());
    return injector as ReflectiveInjector;
}