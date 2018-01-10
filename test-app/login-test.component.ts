import { Component } from "@angular/core";
import { HttpClient, HttpRequest, HttpHeaders, HttpErrorResponse, HttpParams } from "@angular/common/http";

import { AuthTokenGuard } from "./auth-token-guard";
import { Observable } from "rxjs/Observable";

@Component({
    selector: "login-test",
    template: `
    <p>Auth Test</p>
    <p>Token: {{id_token}}</p>
    <p>Name: {{display_name}}</p>
    <button (click)="authenticateUser()">Login</button>
    <button (click)="logoutUser()">Logout</button>
    <button (click)="postData()">Post</button>
    <button (click)="revokeToken()">Revoke</button>
    <button (click)="postLevelData()">Post Data</button>
    <p>Data: {{level_data}}</p>
    <button (click)="postLevelTime()">Post Time</button>
    <p *ngFor="let time of level_times; index as i">{{i}}: {{time}}</p>
    `
})
export class LoginTest {

    id_token: string;
    display_name = "guest";
    level_data = "{}";
    level_times: string[] = [];

    constructor(private http_client_: HttpClient, private token_guard: AuthTokenGuard) {
        this.token_guard.display_name.subscribe(name => {
            this.display_name = name;
        });

        this.token_guard.route_token.subscribe(token => {
            this.id_token = token;
        });
    };
    
    authenticateUser() {
        window.location.href = "/auth/twitch";
    };

    logoutUser() {
        this.token_guard.logoutUser();
    };

    postData() {
        let headers = this.token_guard.setTokenHeader(new HttpHeaders());
        let request = this.http_client_
            .get<{ message: string, token?: string }>("/auth/post", { headers, observe: "body" });

        request.switchMap(res => {
            if (res.message === "Token") {
                this.token_guard.setToken(res.token);
                let headers = this.token_guard.setTokenHeader(new HttpHeaders());
                return this.http_client_
                    .get<{ message: string, token?: string }>("/auth/post", { headers, observe: "body" });
            }
            return Observable.of(res);
        })
        .subscribe(
            result => {
                console.log(`Post result: ${result.message}.`);
            },
            this.handleError
        );
    };

    handleError(err: any) {
        if (err.error instanceof Error) {
            // A client-side or network error occurred. Handle it accordingly.
            console.log('An error occurred:', err.error.message);
        } else {
            // The backend returned an unsuccessful response code.
            // The response body may contain clues as to what went wrong,
            console.log(`server returned code ${err.status}, body was: ${err.error}`);
        }
    };

    revokeToken() {
        let headers = this.token_guard.setTokenHeader(new HttpHeaders());

        this.http_client_.get("/auth/revoke", { headers }).subscribe(result => {
            console.log(`result: ${JSON.stringify(result)}.`);
        }, this.handleError);
    };

    postLevelData() {
        let headers = this.token_guard.setTokenHeader(new HttpHeaders());
        let test_data = { level_name: "test-level" };
        this.http_client_.post<{ level_id: string }>("/level/save", test_data, { headers }).switchMap((result) => {
            let segments = result.level_id.split("~");
            let user_id = segments[0];
            let level_name = segments[1];
            return this.http_client_.get(`/level/get?level_name=${level_name}&user_id=${user_id}`);
        })
        .subscribe(
            (data) => { this.level_data = JSON.stringify(data) },
            this.handleError
        );
    };

    postLevelTime() {
        let time = 5000 + Math.random() * 10000;
        //let user_id = 100000 + Math.random() * 899999;
        let headers = this.token_guard.setTokenHeader(new HttpHeaders());
        let post_data = {
            level_id: `170100236:test-level`,
            time
        };
        this.http_client_.post<{ message: string }>("/time", post_data, { headers }).switchMap((result) => {
            console.log(`post time result: ${result.message}.`);
            return this.http_client_.get<{ times: object[] }>(`/best-times?level_id=${post_data.level_id}`);
        })
        .subscribe((result) => {
                this.level_times = result.times.map(obj => JSON.stringify(obj));
            },
            this.handleError
        )
    };
}