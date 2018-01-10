import { Component, SecurityContext } from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { HttpClient } from "@angular/common/http";

@Component({
    template: `
    <iframe id="auth-frame" [src]="iframe_src"></iframe>
    `,
    styles: [`
    #auth-frame {
        width: 375px;
        height: 100%;
    }
    :host {
        width: 375px;
        height: 100%;
        position: absolute;
        left: 60%;
    }
    `]
})
export class AuthIFrame {

    iframe_src: SafeResourceUrl;

    constructor(private http_client_: HttpClient, private dom_sanitizer: DomSanitizer) { };

    ngOnInit() {
        this.iframe_src = this.dom_sanitizer.bypassSecurityTrustResourceUrl("/auth/twitch");
        //this.getAuthPath().subscribe(safe_uri => this.iframe_src = safe_uri);
    };

    getAuthPath() {
        //return this.http_client_.get<{ uri: string }>("/auth/twitch").map(data => {
        //    return this.dom_sanitizer.bypassSecurityTrustResourceUrl(data.uri);
        //});
    };
}