(function(global) {
    var map = {
        "app": "app",
        "rxjs": "scripts/rxjs",
        "tslib": "scripts/tslib",
        "@angular/common/http": "scripts/@angular/common/bundles/common-http.umd.js"
    };

    var ngBundles = [
        "common", "compiler", "core", "platform-browser", "platform-browser-dynamic", "http", "router", "forms"
    ];

    ngBundles.forEach((name) => {
        map["@angular/" + name] = "scripts/@angular/" + name + "/bundles/" + name + ".umd.js";
    })

    var packages = {
        "app": { main: "./main.js", defaultExtension: "js" },
        "rxjs": { defaultExtension: "js" },
        "tslib": { main: "./tslib.js", defaultExtension: "js" }
    };

    var config = {
        map,
        packages
    }

    System.config(config);

})(this);