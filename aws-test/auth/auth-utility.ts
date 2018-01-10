import crypto = require("crypto");
import uuid_v1 = require("uuid/v1");

export function generateState() {
    return uuid_v1();
};

export function generateNonce() {
    return crypto.randomBytes(16).toString("hex");
};