import DynamoDB = require("aws-sdk/clients/dynamodb");
import { Credentials } from "aws-sdk/global";
import { AWSCredentials } from "../aws-common/dynamodb-module";
import { ClientConfiguration } from "aws-sdk/clients/dynamodb";

const aws_credentials = require("../../server-config/aws-credentials.json") as AWSCredentials;
const base_db_config = require("../../server-config/base-db-config.json") as ClientConfiguration;

async function createTable() {
    let credentials = new Credentials(aws_credentials.access_key_id, aws_credentials.access_key_secret);
    let dynamoDB = new DynamoDB(Object.assign(base_db_config, { credentials }));

    await dynamoDB.createTable({
        TableName: "level_times",
        KeySchema: [
            {
                AttributeName: "level_id",
                KeyType: "HASH"
            },
            {
                AttributeName: "player_id",
                KeyType: "RANGE"
            }
        ],
        AttributeDefinitions: [
            {
                AttributeName: "level_id",
                AttributeType: "S"
            },
            {
                AttributeName: "player_id",
                AttributeType: "S"
            },
            {
                AttributeName: "time",
                AttributeType: "N"
            }
        ],
        ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1
        },
        StreamSpecification: {
            StreamEnabled: false
        },
        LocalSecondaryIndexes: [
            {
                IndexName: "best_times_index",
                KeySchema: [
                    {
                        AttributeName: "level_id",
                        KeyType: "HASH"
                    },
                    {
                        AttributeName: "time",
                        KeyType: "RANGE"
                    }
                ],
                Projection: {
                    ProjectionType: "KEYS_ONLY"
                }
            }
        ]
    }).promise();
}

 createTable().then(() => {
     console.log("table created");
 }).catch(err => { console.log(err.message) });