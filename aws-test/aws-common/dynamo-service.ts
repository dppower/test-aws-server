import { Inject, Optional, Injectable } from "@angular/core";
import { DocumentClient, QueryInput, Key } from "aws-sdk/clients/dynamodb";
import { Request, AWSError } from "aws-sdk/global";
import { table_name, primary_key, sort_key } from "./db-tokens";

@Injectable()
export class DynamoService<T, U, V> {

    constructor(private document_client_: DocumentClient, @Inject(table_name) private table_name_: string,
        @Inject(primary_key) private primary_key_: string, @Optional() @Inject(sort_key) private sort_key_: string
    ) { };

    getItem(primary_value: U, sort_value?: V) {
        let key: { [key: string]: U | V } = { [this.primary_key_]: primary_value };
        if (this.sort_key_) {
            key[this.sort_key_] = sort_value;
        }

        return this.document_client_.get({
            TableName: this.table_name_,
            Key: key
        }).promise().then(output => {
            return output.Item as T;
        });
    };

    countVotes(primary_value: U, index_name?: string) {
        const create_query = (last_key?: Key) => {
            let query: QueryInput = {
                TableName: this.table_name_,
                KeyConditionExpression: `${this.primary_key_} = :value`,
                ExpressionAttributeValues: { ":value": primary_value }
            };
            query.ExclusiveStartKey = last_key;
            return query;
        };

        const repeat_query = async (item_count: number, last_key?: Key) => {
            let query = create_query(last_key);
            let result = await this.document_client_.query(query).promise();
            let count = result.Items.map<number>(item => item.vote).reduce((count, next) => count += next);
            item_count += count;
            if (result.LastEvaluatedKey) {
                repeat_query(item_count, result.LastEvaluatedKey);
            }
            else {
                return item_count;
            }
        };

        return repeat_query(0);
    };

    // Get a list of first n items for a given prmary/partition value
    queryItemsList(primary_value: U, limit: number, index_name?: string) {
        let query: QueryInput = {
            TableName: this.table_name_,
            KeyConditionExpression: `${this.primary_key_} = :value`,
            Limit: limit,
            ExpressionAttributeValues: { ":value": primary_value }
        };
        if (index_name) {
            query.IndexName = index_name;
        }
        return this.document_client_.query(query).promise().then(result => result.Items);
    };

    putItem(value: T) {
        return this.document_client_.put({
            TableName: this.table_name_,
            Item: value
        }).promise();
    };

    setAttribute<K extends keyof T>(attibute: K, value: T[K]) {
        return this.document_client_.update({
            TableName: this.table_name_,
            Key: { [this.primary_key_]: value },
            UpdateExpression: `Set ${attibute} = :value`,
            ExpressionAttributeValues: { ":value": value }
        }).promise();
    };

    deleteItem(value: U) {
        return this.document_client_.delete({
            TableName: this.table_name_,
            Key: { [this.primary_key_]: value }
        }).promise();
    };
}