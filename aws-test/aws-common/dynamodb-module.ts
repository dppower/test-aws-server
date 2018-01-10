import { ReflectiveInjector } from "@angular/core";

import { Credentials } from "aws-sdk/global";
import { ClientConfiguration, DocumentClient } from "aws-sdk/clients/dynamodb";

// Factories
import { buildDBConfig } from "../aws-common/build-db-config";

// Config files
export interface AWSCredentials { access_key_id: string, access_key_secret: string };
const aws_credentials = require("../../server-config/aws-credentials.json") as AWSCredentials;
const base_db_config = require("../../server-config/base-db-config.json") as ClientConfiguration;

// Tokens
import { db_config_token, base_config_token } from "../aws-common/db-tokens";

export async function DynamoDbModule(injector: ReflectiveInjector) {
    return injector.resolveAndCreateChild([
        { provide: Credentials, useValue: new Credentials(aws_credentials.access_key_id, aws_credentials.access_key_secret) },
        { provide: base_config_token, useValue: base_db_config },
        { provide: db_config_token, useFactory: buildDBConfig, deps: [Credentials, base_config_token] },
        { provide: DocumentClient, useFactory: (config: ClientConfiguration) => new DocumentClient(config), deps: [db_config_token] }
    ]);
}