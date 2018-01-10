import crypto = require("crypto");
import fs = require("fs");
import path = require("path");
import util = require("util");

interface Secrets {
    previous: string; //=> previous
    current: string; //=> current
    time: number;
}

export class SecretProvider {

    readonly interval = 86400000;
    readonly overlap = 7200000;

    getVerifySecret() { 
        let current_time = Date.now();
        if (current_time - this.previous_update_time < this.overlap) {
            return this.previous_secret_;
        }
        else {
            return this.current_secret_;
        }
    };

    getSignSecret() {
        return this.current_secret_;
    };

    private secret_path_: string;

    private previous_update_time: number;

    private previous_secret_: Buffer; //=> 0 // Is valid for ~ 2 hours after the changeover
    private current_secret_: Buffer; //=> 1
    
    constructor() {
        this.secret_path_ = path.join(__dirname, "secrets.json");
    };

    initialise() {
        this.previous_update_time = this.getPreviousUpdateTime();

        return this.loadSecretFromFile().then((secrets) => {
            if (this.previous_update_time === secrets.time) {
                this.current_secret_ = Buffer.from(secrets.current, "hex");
                if (secrets.previous) {
                    this.previous_secret_ = Buffer.from(secrets.previous, "hex");
                }
                else {
                    this.previous_secret_ = null;
                }
            }
            else if (this.previous_update_time - secrets.time > this.interval) {
                this.previous_secret_ = null;
                this.current_secret_ = this.generateNewSecret();
            }
            else { //=> this.previous_update_time - secrets.time === this.interval
                this.previous_secret_ = Buffer.from(secrets.current, "hex");
                this.current_secret_ = this.generateNewSecret();
            }

            this.saveSecretsToFile();

            setTimeout(() => {
                this.updateSecrets();
            }, this.getTimeToNextUpdate());
        })
        .catch((err) => {
            // Setup for first time:
            this.previous_secret_ = null;
            this.current_secret_ = this.generateNewSecret();

            this.saveSecretsToFile();

            setTimeout(() => {
                this.updateSecrets();
            }, this.getTimeToNextUpdate());
        });
    };

    generateNewSecret() {
        return crypto.randomBytes(16);
    };

    updateSecrets() {
        this.previous_secret_ = this.current_secret_;
        this.current_secret_ = crypto.randomBytes(16);

        this.previous_update_time = this.getPreviousUpdateTime();

        this.saveSecretsToFile();

        setTimeout(() => {
            this.updateSecrets();
        }, this.getTimeToNextUpdate());
    };

    getTimeToNextUpdate() {
        let now = new Date();
        let time = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0);
        return time.getTime() - now.getTime();
    };
    
    getPreviousUpdateTime() {
        let now = new Date();
        let time = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
        return time.getTime();
    };

    saveSecretsToFile() {
        let secrets: Secrets = {
            previous: (this.previous_secret_ && this.previous_secret_.toString("hex")) || null,
            current: this.current_secret_.toString("hex"),
            time: this.previous_update_time
        };
        let out = JSON.stringify(secrets);
        fs.writeFileSync(this.secret_path_, out);
    };

    loadSecretFromFile() {
        return util.promisify(fs.readFile)(this.secret_path_).then(data => {
            let secrets: Secrets = JSON.parse(data.toString());
            return secrets;
        });
    };
}