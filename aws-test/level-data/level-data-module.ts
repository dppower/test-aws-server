import { Express } from "express";

import { ReflectiveInjector, Injector } from "@angular/core";

// Routes
import { LevelDataRoutes } from "./level-data-routes";

// Services
import { DynamoService } from "../aws-common/dynamo-service";

// Tokens
import { table_name, primary_key, sort_key } from "../aws-common/db-tokens";

export async function LevelDataModule(root_injector: ReflectiveInjector, app: Express) {
    let injector: Injector = root_injector.resolveAndCreateChild([
        DynamoService,
        LevelDataRoutes,
        { provide: table_name, useValue: "level_data" },
        { provide: primary_key, useValue: "user_id" },
        { provide: sort_key, useValue: "level_name" }
    ]);
    
    let routes = injector.get(LevelDataRoutes);
    app.use(routes.initialiseRoutes());
    return injector as ReflectiveInjector;
}