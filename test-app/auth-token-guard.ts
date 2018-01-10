import { Injectable } from '@angular/core';
import { ɵparseCookieValue as parseCookieValue } from '@angular/common';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { HttpClient, HttpHeaders } from "@angular/common/http";

import { BehaviorSubject } from "rxjs/BehaviorSubject";
import { Observable } from "rxjs/Observable";

@Injectable()
export class AuthTokenGuard implements CanActivate {

    readonly display_name = new BehaviorSubject<string>("guest");
    readonly route_token = new BehaviorSubject<string>(null);
    
    constructor(private router_: Router, private http_client_: HttpClient) {
        // Whenever a new token is acquired, recheck the display name:
        this.route_token.subscribe((token) => {
            if (token) {
                console.log(`updated route token: ${token}.`);
                this.getDisplayName(token).subscribe((name) => this.display_name.next(name));
            }
            else {
                this.display_name.next("guest");
            }
        });
    }

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        let url: string = state.url;

        if (url === "/") {
            return true;
        }
        else {
            //let display_name = route.queryParams["display_name"];
            let route_token = route.queryParams["route_token"];

            if (route_token) {
                this.validateRouteToken(route_token).subscribe((token) => this.route_token.next(token));
            }
            
            this.router_.navigate(["/"]);
            return false;
        }
    };

    setTokenHeader(headers: HttpHeaders, route_token?: string) {
        let token = route_token || this.route_token.getValue();
        if (token) {
            return headers.set("x-route-token", token);
        }
        return headers;
    };

    getDisplayName(token: string) {
        let headers = this.setTokenHeader(new HttpHeaders(), token);

        return this.http_client_.get<{ name: string }>("/auth/name", { headers })
            .map((data) => {
                if (data.name) {
                    return data.name;
                }
                else { // Invalid token
                    return "guest";
                }
            })
            .catch(err => {
                return Observable.of("guest");
            });
    };

    setToken(token: string) {
        this.route_token.next(token);
    };

    validateRouteToken(token: string): Observable<string> {
        // Need to check is the token valid and retrieve display name
        let headers = this.setTokenHeader(new HttpHeaders(), token);
        //let test = parseCookieValue(document.cookie, "auth_test");
        //headers.set("x-auth-test", test);

        return this.http_client_.get<{ test: boolean }>("/auth/test", { headers })
            .map((data) => {
                if (data.test) {
                    return token;
                }
                else { // Invalid token
                    return null
                }
            })
            .catch(err => {
                return Observable.of(null);
            });
    };

    logoutUser() {
        this.route_token.next(null);
    };
}