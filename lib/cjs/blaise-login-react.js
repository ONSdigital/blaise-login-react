"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginHandler = exports.newLoginHandler = exports.validatePassword = exports.getUser = exports.useToken = void 0;
var token_1 = require("./client/token");
Object.defineProperty(exports, "useToken", { enumerable: true, get: function () { return token_1.useToken; } });
var user_1 = require("./client/user");
Object.defineProperty(exports, "getUser", { enumerable: true, get: function () { return user_1.getUser; } });
Object.defineProperty(exports, "validatePassword", { enumerable: true, get: function () { return user_1.validatePassword; } });
var loginHandler_1 = __importStar(require("./server/handlers/loginHandler"));
exports.newLoginHandler = loginHandler_1.default;
Object.defineProperty(exports, "LoginHandler", { enumerable: true, get: function () { return loginHandler_1.LoginHandler; } });
