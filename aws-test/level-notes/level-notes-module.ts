import { Express } from "express";
import { ReflectiveInjector, Injector } from "@angular/core";

// Routes
import { LevelNotesRoutes } from "./level-notes-routes";

// Services
import { DynamoService } from "../aws-common/dynamo-service";

// Tokens
import { table_name, primary_key, sort_key } from "../aws-common/db-tokens";

// Testing

export async function LevelNotesModule(root_injector: ReflectiveInjector, app: Express) {
    let injector: Injector = root_injector.resolveAndCreateChild([
        DynamoService,
        LevelNotesRoutes,
        { provide: table_name, useValue: "level_notes" },
        { provide: primary_key, useValue: "level_id" },
        { provide: sort_key, useValue: "expiry" }
    ]);

    let routes = injector.get(LevelNotesRoutes);
    app.use(routes.initialiseRoutes());
    return injector as ReflectiveInjector;
}