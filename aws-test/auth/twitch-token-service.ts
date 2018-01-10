import jwt = require("jsonwebtoken");
import querystring = require("querystring");
import { RequestOptions } from "https";
const rsaToPem = require("jwks-rsa/lib/utils").rsaPublicKeyToPEM as (mod: string, exp: string) => string;
import { TwitchAuthClient, TwitchAccess, TokenResponse } from "./twitch-auth-client";
import { Injectable } from "@angular/core";

export interface TwitchClaims {
    sub: string;
    iss: "https://api.twitch.tv/api";
    aud: string;
    exp: string;
    iat: string;
    nonce: string;
}

export interface TwitchJWK {
    kty: string;
    n: string;
    e: string;
    alg?: string;
    use?: string;
    kid?: string;
}

@Injectable()
export class TwitchTokenService {

    private pem_: string;

    readonly client_token_segment_: string;
    readonly refresh_token_path_: string;

    constructor(private twitch_access_: TwitchAccess, private auth_client_: TwitchAuthClient) {
        let token_params = Object.assign({}, this.twitch_access_);
        delete token_params.redirect_uri;

        this.client_token_segment_ = querystring.stringify(token_params);
        this.refresh_token_path_ = "/kraken/oauth2/token" + "?grant_type=refresh_token&" + this.client_token_segment_ + "&refresh_token=";
    };

    async getPublicKeyCert() {
        const options: RequestOptions = {
            host: "api.twitch.tv",
            path: "/api/oidc/keys"
        };

        this.pem_ = await this.auth_client_.sendRequest(options).then((keys_list: { keys: TwitchJWK[] }) => {
            let valid_keys = keys_list.keys.filter((key) => key.use === "sig" && key.kty === "RSA");

            if (valid_keys.length === 1) {
                let cert = valid_keys[0];
                return rsaToPem(cert.n, cert.e);
            }
            else {
                throw new Error("Failed to get public JWK from twitch.");
            }
        });
    };

    getNewAccessToken(refresh_token: string, access_token: string) {
        const path = this.refresh_token_path_ + querystring.escape(refresh_token);
        
        const options: RequestOptions = {
            host: "api.twitch.tv",
            method: "POST",
            path
        };

        return this.auth_client_.sendRequest<TokenResponse>(options);
    };

    revokeAccessToken(access_token: string) {
        const path = `/kraken/oauth2/revoke?client_id=${this.twitch_access_.client_id}&token=${access_token}`;

        const options: RequestOptions = {
            host: "api.twitch.tv",
            method: "POST",
            path
        };

        return this.auth_client_.sendRequest(options);
    };

    validateAccessToken(access_token: string) {
        const path = `/kraken`;
        const options: RequestOptions = {
            host: "api.twitch.tv",
            method: "GET",
            path,
            headers: {
                "Authorization": "OAuth " + access_token,
                "Client-ID": this.twitch_access_.client_id
            }
        };

        type Response = { token: { valid: boolean, authorization: { scopes: string[] } } };
        return this.auth_client_.sendRequest<Response>(options)
            .then((response) => {
                if (!response) return false;
                return response.token.valid &&  response.token.authorization.scopes.length !== 0;
            });
    };

    verifyToken(id_token: string, subject: string, nonce: string): Promise<TwitchClaims> {
        const verify_options: jwt.VerifyOptions = {
            issuer: "https://api.twitch.tv/api",
            audience: this.twitch_access_.client_id,
            subject
        };

        return new Promise((resolve, reject) => {
            jwt.verify(id_token, this.pem_, verify_options, (err, decoded: TwitchClaims) => {
                if (err) {
                    reject(new Error(err.message));
                }
                else {
                    if (nonce !== decoded.nonce) {
                        reject(new Error("jwt nonce invalid."));
                    }
                    else {
                        resolve(decoded);
                    }
                }
            });
        });
    };
}