declare namespace Game {
    
    export type LayerState = 0 | 1 | 2;

    export interface LayerData {
        state: LayerState;
        color: string;
        start_x?: number;
        start_y?: number;
        end_x?: number;
        end_y?: number;
        position?: number;
        rotation?: number;
        width?: number;
        height?: number;
    }

    export interface TileData {
        shape: string;
        material: string;
        row: number;
        column: number;
    }

    export interface LevelData {
        //level_id: string; 
        user_id: string; //=> partition key
        level_name: string; //=> sort key
        level_description: string;
        layers: LayerData[];
        tiles: TileData[];
        goal_x: number;
        goal_y: number;
        player_x: number;
        player_y: number;
    }
}

declare namespace Auth { 
    export interface RouteToken {
        state: string;
        nonce: string;
        access_token: string;
        id: string;
        exp: number;
    }
}

declare namespace Express {
    export interface Request {
        route_token: Auth.RouteToken;
        is_access_token_valid: boolean;
    }
}
