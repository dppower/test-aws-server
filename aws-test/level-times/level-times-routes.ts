import { Injectable } from "@angular/core";
import { Router } from "express";
import { DynamoService } from "../aws-common/dynamo-service";
import { AuthRoutes } from "../auth/auth-routes";

interface LevelTime {
    level_id: string; //=> partition key = level_name + creator_id
    player_id: string; //=> sort key
    time: number; //=> level completion time in ms
    submitted: number; //=> when time was submitted to server in ms
}

@Injectable()
export class LevelTimesRoutes {
    private router_: Router;

    constructor(private dynamo_service_: DynamoService<LevelTime, string, string>,
        private auth_routes: AuthRoutes
    ) { };

    initialiseRoutes() {
        this.router_ = Router();
        this.setRoutes();
        return this.router_;
    };   

    setRoutes() {
        // Get scoreboard, TODO: find a method for caching the best times
        this.router_.get("/best-times", async (req, res, next) => {            
            let level_id = req.query.level_id;
            try {
                let best_times = await this.dynamo_service_.queryItemsList(level_id, 20, "best_times_index");
                res.json({ times: best_times });
            }
            catch (err) {
                res.sendStatus(503).end();
            }
        });

        // Check is user in table, i.e. has player previously played the level
        // Get the user's time
        this.router_.get("/time", this.auth_routes.decodeRouteToken, async (req, res, next) => {
            let level_id = req.query.level_id;
            let player_id = req.route_token.id;
            try {
                let level_score = await this.dynamo_service_.getItem(level_id, player_id);
                res.json(level_score);
            }
            catch (err) {
                res.sendStatus(503).end();
            }       
        });

        //Set new time 
        this.router_.post("/time", this.auth_routes.decodeRouteToken, async (req, res, next) => {
            // Needs to be a valid session
            let data = req.body as LevelTime;
            //let time = req.query.time;
            //let level_id = req.query.level_id;
            data.player_id = req.route_token.id;
            data.submitted = Date.now();
            //let data: LevelTime = { level_id, player_id, time, submitted };
            try {
                await this.dynamo_service_.putItem(data);
                res.json({ message: "success" });
            }
            catch (err) {
                res.sendStatus(503).end();
            }
        });
    }
}