import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AuthTokenGuard } from "./auth-token-guard";
import { LoginTest } from "./login-test.component";

const app_routes: Routes = [
    { path: "", canActivate: [ AuthTokenGuard ], component: LoginTest }
];

@NgModule({
    imports: [
        RouterModule.forRoot(
            app_routes,
            //{ enableTracing: true } // <-- debugging purposes only
        )
    ],
    exports: [
        RouterModule
    ]
})
export class AppRoutingModule { }