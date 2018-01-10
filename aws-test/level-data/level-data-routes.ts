import { Injectable } from "@angular/core";
import { Router } from "express";
import { DynamoService } from "../aws-common/dynamo-service";
import { AuthRoutes } from "../auth/auth-routes";

@Injectable()
export class LevelDataRoutes {
    private router_: Router;

    constructor(private dynamo_service_: DynamoService<Game.LevelData, string, string>,
        private auth_routes: AuthRoutes
    ) { };

    validateLevelData(level_data: Game.LevelData, req: Express.Request) {
        // TODO: Check the data?
        // Generate level_id is user_id#level_name
        //level_data.level_id = req.route_token.id + "_" + level_data.level_name;
        // Get twitch id
        level_data.user_id = req.route_token.id;
        return level_data;
    };

    initialiseRoutes() {
        this.router_ = Router();
        this.setRoutes();
        return this.router_;
    };

    setRoutes() {
        this.router_.post("/level/save", this.auth_routes.decodeRouteToken, async (req, res, next) => {
            let level_data = req.body as Game.LevelData;
            //level_data = this.validateLevelData(level_data, req);
            level_data.user_id = req.route_token.id;

            let level_id = level_data.user_id + ":" + level_data.level_name;

            try {
                await this.dynamo_service_.putItem(level_data);
                //res.sendStatus(200).send();
                res.json({ level_id });
            }
            catch (err) {
                res.sendStatus(503);
            }
        });

        //=> /level/get?level_name=<level_name>&user_id=<user_id>
        this.router_.get("/level/get", async (req, res, next) => {
            let level_name: string = req.query.level_name;
            let user_id: string = req.query.user_id;

            if (!level_name || !user_id) {
                return res.json({ message: "missing query params /level/get?level_name=<string>&user_id=<string>" });
            }

            try {
                let level_data = await this.dynamo_service_.getItem(user_id, level_name);
                res.json(level_data);
            }
            catch (err) {
                console.log(`error message: ${err.message}.`);
                res.sendStatus(503);
            }
        });
    };
}