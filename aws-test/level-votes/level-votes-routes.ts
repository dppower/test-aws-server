import { Injectable } from "@angular/core";
import { Router } from "express";
import { DynamoService } from "../aws-common/dynamo-service";
import { AuthRoutes } from "../auth/auth-routes";

interface LevelVote {
    level_id: string; //=> partition key = level_name + creator_id
    user_id: string; //=> sort key
    vote: 0 | 1;
    submitted: number; //=> time in ms that vote was submitted
}

@Injectable()
export class LevelVotesRoutes {
    private router_: Router;

    constructor(private dynamo_service_: DynamoService<LevelVote, string, string>,
        private auth_routes: AuthRoutes
    ) { };

    initialiseRoutes() {
        this.router_ = Router();
        this.setRoutes();
        return this.router_;
    };   

    setRoutes() {
        // Get scoreboard, TODO: find a method for caching the best times
        this.router_.get("/vote-count", async (req, res, next) => {            
            let level_id = req.query.level_id;
            try {
                let vote_count = await this.dynamo_service_.countVotes(level_id);
                res.json({ vote_count });
            }
            catch (err) {
                console.log(`error message: ${err.message}.`);
                res.sendStatus(503).end();
            }
        });

        // Check is user in table, i.e. has player previously played the level
        // Get the user's time
        this.router_.get("/vote", this.auth_routes.decodeRouteToken, async (req, res, next) => {
            let level_id = req.query.level_id;
            let player_id = req.route_token.id;
            try {
                let level_score = await this.dynamo_service_.getItem(level_id, player_id);
                res.json(level_score);
            }
            catch (err) {
                console.log(`error message: ${err.message}.`);
                res.sendStatus(503).end();
            }
        });

        //Set vote, either 0 or 1
        this.router_.post("/vote", this.auth_routes.decodeRouteToken, async (req, res, next) => {
            // Needs to be a valid session
            let data = req.body as LevelVote;
            data.user_id = req.route_token.id;
            data.submitted = Date.now();

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