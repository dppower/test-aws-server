import { enableProdMode } from "@angular/core";
import { platformBrowserDynamic } from "@angular/platform-browser-dynamic";
import { AppModule } from "./app.module";
import "./rxjs-extensions";

//enableProdMode();
platformBrowserDynamic().bootstrapModule(AppModule);