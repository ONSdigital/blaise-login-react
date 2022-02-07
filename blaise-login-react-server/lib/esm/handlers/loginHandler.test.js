var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import supertest from "supertest";
import jwt from "jsonwebtoken";
import { Auth } from "../blaise-login-react-server";
import BlaiseApiClient from "blaise-api-node-client";
import newLoginHandler from "./loginHandler";
import express from "express";
var mockGetUser = jest.fn();
var mockValidatePassword = jest.fn();
jest.mock("blaise-api-node-client");
BlaiseApiClient.prototype.getUser = mockGetUser;
BlaiseApiClient.prototype.validatePassword = mockValidatePassword;
var config = {
    SessionSecret: "fake-secret",
    SessionTimeout: "10m",
    Roles: ["DST", "BDSS", "TO Manager"],
    BlaiseApiUrl: "localhost:80"
};
var auth = new Auth(config);
var blaiseApiClient = new BlaiseApiClient(config.BlaiseApiUrl);
function newServer() {
    var server = express();
    var loginHandler = newLoginHandler(auth, blaiseApiClient);
    server.use(loginHandler);
    server.get("/authtest", auth.Middleware, function (_request, response) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                response.status(200).json("Hello, world!");
                return [2 /*return*/];
            });
        });
    });
    return server;
}
var app = newServer();
var request = supertest(app);
describe("LoginHandler", function () {
    beforeEach(function () {
        mockGetUser.mockClear();
        mockValidatePassword.mockClear();
    });
    describe("Get user", function () {
        it("should return a 200 and the user details", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockGetUser.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, Promise.resolve({ "role": "test" })];
                            });
                        }); });
                        return [4 /*yield*/, request.get("/api/login/users/bob")];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toEqual(200);
                        expect(mockGetUser).toHaveBeenCalled();
                        expect(response.body).toEqual({ "role": "test" });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("Get current user", function () {
        it("should return a 200 and the user details", function () { return __awaiter(void 0, void 0, void 0, function () {
            var token, response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        token = auth.SignToken({
                            name: "test",
                            role: "DST",
                            defaultServerPark: "gusty",
                            serverParks: ["gusty"]
                        });
                        return [4 /*yield*/, request.get("/api/login/current-user").set("authorization", token)];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toEqual(200);
                        expect(response.body).toEqual({
                            name: "test",
                            role: "DST",
                            defaultServerPark: "gusty",
                            serverParks: ["gusty"]
                        });
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("Validate Password", function () {
        it("should return a 200 and true", function () { return __awaiter(void 0, void 0, void 0, function () {
            var response;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        mockValidatePassword.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                return [2 /*return*/, Promise.resolve(true)];
                            });
                        }); });
                        return [4 /*yield*/, request.post("/api/login/users/password/validate")];
                    case 1:
                        response = _a.sent();
                        expect(response.status).toEqual(200);
                        expect(response.body).toBeTruthy();
                        return [2 /*return*/];
                }
            });
        }); });
    });
    describe("Validate Roles", function () {
        describe("with an invalid role", function () {
            it("should return a 403", function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mockGetUser.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, Promise.resolve({ "role": "test" })];
                                });
                            }); });
                            return [4 /*yield*/, request.get("/api/login/users/bob/authorised")];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(403);
                            expect(mockGetUser).toHaveBeenCalled();
                            expect(response.body).toEqual({ "error": "Not authorised" });
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with an valid role", function () {
            it("should return a 200 and the user details as an encoded jwt", function () { return __awaiter(void 0, void 0, void 0, function () {
                var response, myJwt, decodedJwt;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            mockGetUser.mockImplementation(function () { return __awaiter(void 0, void 0, void 0, function () {
                                return __generator(this, function (_a) {
                                    return [2 /*return*/, Promise.resolve({ "role": "DST" })];
                                });
                            }); });
                            return [4 /*yield*/, request.get("/api/login/users/bob/authorised")];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(200);
                            expect(mockGetUser).toHaveBeenCalled();
                            myJwt = response.body.token;
                            decodedJwt = jwt.decode(myJwt);
                            if (decodedJwt) {
                                expect(decodedJwt["user"]).toEqual({ "role": "DST" });
                            }
                            else {
                                expect(decodedJwt).not.toBeNull();
                            }
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    describe("ValidateToken", function () {
        describe("with an no token", function () {
            it("should return a 403", function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, request.post("/api/login/token/validate")
                                .send({})
                                .set("Content-Type", "application/json")];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(403);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with an invalid token", function () {
            it("should return a 403", function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, request.post("/api/login/token/validate")
                                .send({ token: "not a token and that" })
                                .set("Content-Type", "application/json")];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(403);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with a valid token but no role", function () {
            it("should return a 403", function () { return __awaiter(void 0, void 0, void 0, function () {
                var token, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            token = jwt.sign("random token", config.SessionSecret);
                            return [4 /*yield*/, request.post("/api/login/token/validate")
                                    .send({ token: token })
                                    .set("Content-Type", "application/json")];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(403);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with a valid token but invalid role", function () {
            it("should return a 403", function () { return __awaiter(void 0, void 0, void 0, function () {
                var token, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            token = jwt.sign({ user: { role: "TO Interviewer" } }, config.SessionSecret);
                            return [4 /*yield*/, request.post("/api/login/token/validate")
                                    .send({ token: token })
                                    .set("Content-Type", "application/json")];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(403);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with a valid token and role", function () {
            it("should return a 200", function () { return __awaiter(void 0, void 0, void 0, function () {
                var token, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            token = jwt.sign({ user: { role: "DST" } }, config.SessionSecret);
                            return [4 /*yield*/, request.post("/api/login/token/validate")
                                    .send({ token: token })
                                    .set("Content-Type", "application/json")];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(200);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
    describe("Middleware", function () {
        describe("with no auth header", function () {
            it("should return a 403", function () { return __awaiter(void 0, void 0, void 0, function () {
                var response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0: return [4 /*yield*/, request.get("/authtest")];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(403);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with an invalid jwt auth header", function () {
            it("should return a 403", function () { return __awaiter(void 0, void 0, void 0, function () {
                var token, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            token = jwt.sign({ user: { role: "TO Interviewer" } }, config.SessionSecret);
                            return [4 /*yield*/, request.get("/authtest")
                                    .set("authorization", token)];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(403);
                            return [2 /*return*/];
                    }
                });
            }); });
        });
        describe("with an valid jwt auth header", function () {
            it("should enter the wrapped function", function () { return __awaiter(void 0, void 0, void 0, function () {
                var token, response;
                return __generator(this, function (_a) {
                    switch (_a.label) {
                        case 0:
                            token = jwt.sign({ user: { role: "DST" } }, config.SessionSecret);
                            return [4 /*yield*/, request.get("/authtest")
                                    .set("Authorization", token)];
                        case 1:
                            response = _a.sent();
                            expect(response.status).toEqual(200);
                            expect(response.body).toEqual("Hello, world!");
                            return [2 /*return*/];
                    }
                });
            }); });
        });
    });
});
