import { InjectionToken } from "@angular/core";
import { ClientConfiguration } from "aws-sdk/clients/dynamodb";

export const base_config_token = new InjectionToken<ClientConfiguration>("base-config-token"); 
export const db_config_token = new InjectionToken<ClientConfiguration>("db-config-token");
export const table_name = new InjectionToken<string>("table-name");
export const primary_key = new InjectionToken<string>("primary-key");
export const sort_key = new InjectionToken<string>("sort-key");
