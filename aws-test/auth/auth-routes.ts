import express = require("express");

import { Injectable } from "@angular/core";

import { TwitchAuthClient, TokenResponse, TwitchResponseError } from "./twitch-auth-client";
import { SessionStore } from "./session-store";
import { TwitchTokenService } from "./twitch-token-service";
import { RouteTokenService } from "./route-token-service";

@Injectable()
export class AuthRoutes {
    
    private router_: express.Router;

    constructor(private route_token_service_: RouteTokenService, private twitch_auth_client_: TwitchAuthClient,
        private twitch_token_service_: TwitchTokenService, private session_store_: SessionStore
    ) { };

    initialiseRoutes() {
        this.router_ = express.Router();
        this.setRoutes();
        return this.router_;
    };

    decodeRouteToken = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        let token = req.headers["x-route-token"] as string;

        if (token) {
            // verifies secret and checks exp
            this.route_token_service_.verifyToken(token)
                .then((route_token) => {
                    req.route_token = route_token;
                    next();
                })
                .catch((err) => {
                    res.status(403).send("Invalid route token.");
                });
        } else {
            // if there is no token return an error
            //next(new Error("No route token provided."));
            res.status(403).send("No route token provided.");
        }
    };

    checkAccessToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

        let access_token = req.route_token.access_token;

        try {
            let is_valid = await this.twitch_token_service_.validateAccessToken(access_token);

            if (is_valid) {
                req.is_access_token_valid = is_valid;
                next();
            }
            else {
                console.log(`access token is invalid.`);
                // Try to refresh token:
                let refresh_token = await this.session_store_.getToken(req.route_token.state);
                let response = await this.twitch_token_service_.getNewAccessToken(refresh_token, access_token);
                if (!response) {
                    // if error, then refresh token is invalid, restart authentication
                    res.redirect("/auth/twitch");
                }
                else {
                    // Save new refresh
                    await this.session_store_.saveToken(req.route_token.state, response.refresh_token);
                    
                    // Create new token
                    let token = this.route_token_service_.createToken(req.route_token.id,
                        response.access_token, req.route_token.state, req.route_token.nonce
                    );

                    res.json({
                        message: "Token",
                        token
                    });
                }
            }
        }
        catch (err) {
            next(err);
        }
    };

    setRoutes() {
        this.router_.get("/auth/revoke", this.decodeRouteToken, async (req, res, next) => {
            try {
                let result = await this.twitch_token_service_.revokeAccessToken(req.route_token.access_token);
                res.json({ message: "Success" });
            }
            catch (err) {
                next(err);
            }           
        });

        this.router_.get("/auth/post", this.decodeRouteToken, this.checkAccessToken, (req, res) => {
            res.json({ message: "Success" });
        });

        this.router_.get("/auth/test", this.decodeRouteToken, async (req, res) => {
            let cookie_nonce = req.cookies.auth_test;
            if (req.route_token.nonce !== cookie_nonce) {
                res.json({
                    test: false
                })
            }
            else {
                //let user_profile = await this.twitch_auth_client_.requestUserProfile(req.route_token.access_token);
                res.clearCookie("auth_test");
                res.json({
                    test: true
                });
            }
        });

        this.router_.get("/auth/name", this.decodeRouteToken, async (req, res) => {
            let user_profile = await this.twitch_auth_client_.requestUserProfile(req.route_token.access_token);
            res.json({
                name: user_profile.display_name
            });
        });

        this.router_.get("/auth/twitch", (req, res) => {
            if (this.session_store_.status !== "connect") {
                res.status(503).end();
            };

            this.twitch_auth_client_.requestAuthCode().then(url => {
                res.redirect(url);
            })
            .catch(err => {
                res.status(503).end();
            });
        });

        this.router_.get("/auth/twitch/callback", async (req, res, next) => {
            
            let id_token = req.query.id_token; //=> id_token returned as query param different to json body
            let code = req.query.code;
            let state = req.query.state;

            try {              
                let tokens = await this.twitch_auth_client_.requestTokens(code, state);
                
                if (!tokens) {
                    throw new Error("Failed to retrieve tokens from twitch.");
                }

                let user_profile = await this.twitch_auth_client_.requestUserProfile(tokens.access_token);

                if (!user_profile) {
                    throw new Error("Failed to retrieve user profile from twitch.");
                }
                
                // Verify id_token
                let nonce = await this.session_store_.getNonce(state);
                await this.twitch_token_service_.verifyToken(id_token, user_profile.id, nonce);

                // Save refresh token:
                await this.session_store_.saveToken(state, tokens.refresh_token);

                // Return the display name to browser and session-cookie/jwt to client
                let token = this.route_token_service_.createToken(user_profile.id, tokens.access_token, state, nonce);
                
                res.cookie("auth_test", nonce);
                res.redirect(`/?route_token=${token}`);
            }
            catch (err) {
                return next(err);
            }           
        });
    };
}