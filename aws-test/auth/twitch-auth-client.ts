import https = require("https");
import querystring = require("querystring");
import { Request, Response, NextFunction } from "express";
import { generateNonce, generateState } from "./auth-utility";
import { SessionStore } from "./session-store";
import { Injectable } from "@angular/core";

export class TwitchAccess {
    client_id: string;
    client_secret: string;
    redirect_uri: string;
}

export interface TokenResponse {
    access_token: string;
    refresh_token: string;
    id_token: string;
    scope?: string[];
    expires_in?: number;
}

export interface TwitchResponseError {
    error: string;
    status: string;
    message: string;
}

export interface TwitchProfile {
    id: string;
    display_name: string;
    login: string;
    email: string;
}

@Injectable()
export class TwitchAuthClient {

    readonly openid_discovery = "https://api.twitch.tv/api/.well-known/openid-configuration";

    readonly authorize_endpoint = "https://api.twitch.tv/kraken/oauth2/authorize";

    readonly token_base_path = "/api/oauth2/token";

    readonly auth_query_path: string;
    readonly token_query_path: string;
    readonly user_query_path = `/helix/users`;

    constructor(private twitch_access_: TwitchAccess, private session_store_: SessionStore) {
        let auth_params = Object.assign({}, this.twitch_access_);
        delete auth_params.client_secret;
        let token_params = Object.assign({}, this.twitch_access_);

        this.auth_query_path = "?" + querystring.stringify(auth_params) + "&response_type=id_token+code&scope=openid+user:read:email";
        this.token_query_path = "?" + querystring.stringify(token_params);
    };

    requestTokens(code: string, state: string) {

        const path = this.token_base_path + this.token_query_path + "&grant_type=authorization_code&code=" + code;

        const options: https.RequestOptions = {
            host: "api.twitch.tv",
            method: "POST",
            path: path
        };

        return this.sendRequest<TokenResponse>(options);      
    }

    requestAuthCode() {

        let state = generateState();
        let nonce = generateNonce();

        let url = this.authorize_endpoint + this.auth_query_path + "&state=" + state + "&nonce=" + nonce;

        return new Promise<string>((resolve, reject) => {
            this.session_store_.saveToken(state, nonce).then((result) => {
                resolve(url);
            }, err => reject(err));
        });
    };

    requestUserProfile(access_token: string) {
        const options: https.RequestOptions = {
            host: "api.twitch.tv",
            method: "GET",
            path: this.user_query_path,
            headers: {
                //"Accept": "application/vnd.twitchtv.v5+json",
                "Authorization": "Bearer " + access_token,
                "Client-ID": this.twitch_access_.client_id
            }
        };

        return this.sendRequest<{ data: TwitchProfile[] }>(options).then(res => res.data[0]);
    };

    sendRequest<T>(options: https.RequestOptions, post_data?: string) {
        return new Promise<T | TwitchResponseError>((resolve, reject) => {
            let data: Buffer[] = [];
            const request = https.request(options, (res) => {
                if (res.statusCode >= 500) {
                    return reject(new Error(`No Response from: ${options.host + options.path}, Status Code:${res.statusCode}.`));
                }

                if (res.statusCode < 200 || (res.statusCode >= 300 && res.statusCode < 400)) {
                    return reject(new Error(`Unhandled response from: ${options.host + options.path}, Status Code:${res.statusCode}.`));
                }

                //console.log(`request, path: ${options.path}, headers: ${JSON.stringify(res.headers)}.`);
                // Any 200 or 400 response should return JSON in body
                res.on("data", (chunk: Buffer) => data.push(chunk));
                res.on("end", () => {
                    //console.log(`buffer data: ${Buffer.concat(data).toString()}.`);
                    resolve(JSON.parse(Buffer.concat(data).toString()));
                });
            });

            request.on("error", (err: Error) => reject(err));

            if (post_data) {
                request.write(post_data);
            }

            request.end();
        })
        .then((data) => {
            if ((<TwitchResponseError>data).error) {
                console.log(`Twitch response error: ${JSON.stringify(data)}.`);
                //throw new Error((<TwitchResponseError>data).message);
                return null;
            }
            return data as T;
        });
    };
};