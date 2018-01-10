import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { HttpClientModule, HTTP_INTERCEPTORS } from "@angular/common/http";
import { AppRoutingModule } from "./app-routes";

import { AppComponent } from "./app.component";
import { RequestLogger } from "./request-logger";
import { AuthTokenGuard } from "./auth-token-guard";
import { LoginTest } from "./login-test.component";

@NgModule({
    imports: [BrowserModule, HttpClientModule, AppRoutingModule],
    providers: [{ provide: HTTP_INTERCEPTORS, useClass: RequestLogger, multi: true }, AuthTokenGuard],
    declarations: [ AppComponent, LoginTest ],
    bootstrap: [ AppComponent ]
})
export class AppModule { };