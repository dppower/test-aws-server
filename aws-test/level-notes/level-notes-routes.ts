import { Injectable } from "@angular/core";
import { Router } from "express";
import { DynamoService } from "../aws-common/dynamo-service";
import { AuthRoutes } from "../auth/auth-routes";

interface LevelNote {
    level_id: string; //=> partition key = level_name + creator_id
    user_id: string;
    note: string;
    x_position: number;
    y_position: number;
    expiry: number; //=> sort key
}

@Injectable()
export class LevelNotesRoutes {
    private router_: Router;

    constructor(private dynamo_service_: DynamoService<LevelNote, string, number>,
        private auth_routes: AuthRoutes
    ) { };

    initialiseRoutes() {
        this.router_ = Router();
        this.setRoutes();
        return this.router_;
    };   

    setRoutes() {
        // Set TTL and add a secondary index
        // Get notes for a level, TODO: find a method to delete low values
        this.router_.get("/notes", async (req, res, next) => {            
            let level_id = req.query.level_id;
            try {
                
            }
            catch (err) {
                console.log(`error message: ${err.message}.`);
                res.sendStatus(503).end();
            }
        });
        

        //Set new time ("/time?level_id=<>&time=<>
        this.router_.post("/note", this.auth_routes.decodeRouteToken, async (req, res, next) => {

            let data = req.body as LevelNote;
            data.user_id = req.route_token.id;
            data.expiry = Math.trunc(Date.now() / 1000) + 172800; //=> seconds

            console.log(`time data: ${JSON.stringify(data)}.`);
            try {
                await this.dynamo_service_.putItem(data);
                res.json({ message: "success" });
            }
            catch (err) {
                console.log(`error message: ${err.message}.`);
                res.sendStatus(503).end();
            }
        });
    }
}