import { ClientConfiguration } from "aws-sdk/clients/dynamodb";
import { Credentials } from "aws-sdk/global";

export function buildDBConfig(credentials: Credentials, config: ClientConfiguration) {
    return (<ClientConfiguration>Object.assign({}, config, { credentials }));
}