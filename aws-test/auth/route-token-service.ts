import jwt = require("jsonwebtoken");
import { SecretProvider } from "./secret-provider";
import { Injectable } from "@angular/core";

@Injectable()
export class RouteTokenService {

    constructor(private secret_provider_: SecretProvider) { };

    createToken(id: string, access_token: string, state: string, nonce: string) {
        let now = new Date();
        now.setHours(now.getHours() + 1);
        let exp = now.getTime();

        let identity: Auth.RouteToken = {
            id,
            access_token,
            state,
            nonce,
            exp
        };

        return jwt.sign(identity, this.secret_provider_.getSignSecret());
    };

    verifyToken(token: string) {
        return new Promise<Auth.RouteToken>((resolve, reject) => {
            jwt.verify(token, this.secret_provider_.getVerifySecret(), undefined, (err, decoded: Auth.RouteToken) => {
                if (err) {
                    return reject(err);
                }

                resolve(decoded);
            });
        });
    };
}