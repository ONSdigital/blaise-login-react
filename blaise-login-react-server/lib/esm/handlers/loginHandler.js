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
import express from "express";
export default function newLoginHandler(auth, blaiseApiClient) {
    var router = express.Router();
    router.use(express.json());
    var loginHandler = new LoginHandler(auth, blaiseApiClient);
    router.get("/api/login/users/:username", loginHandler.GetUser);
    router.get("/api/login/current-user", loginHandler.GetCurrentUser);
    router.get("/api/login/users/:username/authorised", loginHandler.ValidateRoles);
    router.post("/api/login/token/validate", loginHandler.ValidateToken);
    router.post("/api/login/users/password/validate", loginHandler.ValidatePassword);
    return router;
}
var LoginHandler = /** @class */ (function () {
    function LoginHandler(auth, blaiseApiClient) {
        this.auth = auth;
        this.blaiseApiClient = blaiseApiClient;
        this.GetUser = this.GetUser.bind(this);
        this.GetCurrentUser = this.GetCurrentUser.bind(this);
        this.ValidatePassword = this.ValidatePassword.bind(this);
        this.ValidateRoles = this.ValidateRoles.bind(this);
        this.ValidateToken = this.ValidateToken.bind(this);
    }
    LoginHandler.prototype.GetUser = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log("Getting user");
                        _b = (_a = res.status(200)).json;
                        return [4 /*yield*/, this.blaiseApiClient.getUser(req.params.username)];
                    case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
                }
            });
        });
    };
    LoginHandler.prototype.GetCurrentUser = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                user = this.auth.GetUser(this.auth.GetToken(req));
                console.log("User from jwt token" + JSON.stringify(user));
                return [2 /*return*/, res.status(200).json(user)];
            });
        });
    };
    LoginHandler.prototype.ValidatePassword = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var _a, username, password, _b, _c;
            return __generator(this, function (_d) {
                switch (_d.label) {
                    case 0:
                        console.log("Validating password");
                        _a = req.body, username = _a.username, password = _a.password;
                        if (username === undefined || username === "" || password === undefined || password === "") {
                            return [2 /*return*/, res.status(400).json({ "error": "Username or password has not been supplied" })];
                        }
                        _c = (_b = res.status(200)).json;
                        return [4 /*yield*/, this.blaiseApiClient.validatePassword(username, password)];
                    case 1: return [2 /*return*/, _c.apply(_b, [_d.sent()])];
                }
            });
        });
    };
    LoginHandler.prototype.ValidateRoles = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Validating user roles");
                        return [4 /*yield*/, this.blaiseApiClient.getUser(req.params.username)];
                    case 1:
                        user = _a.sent();
                        if (this.auth.UserHasRole(user)) {
                            return [2 /*return*/, res.status(200).json({ token: this.auth.SignToken(user) })];
                        }
                        return [2 /*return*/, res.status(403).json({ "error": "Not authorised" })];
                }
            });
        });
    };
    LoginHandler.prototype.ValidateToken = function (req, res) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (this.auth.ValidateToken(req.body.token)) {
                    return [2 /*return*/, res.status(200).json()];
                }
                return [2 /*return*/, res.status(403).json()];
            });
        });
    };
    return LoginHandler;
}());
export { LoginHandler };
