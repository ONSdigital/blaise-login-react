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
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
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
import jwt from "jsonwebtoken";
var Auth = /** @class */ (function () {
    function Auth(config) {
        this.config = config;
        this.SignToken = this.SignToken.bind(this);
        this.ValidateToken = this.ValidateToken.bind(this);
        this.UserHasRole = this.UserHasRole.bind(this);
        this.Middleware = this.Middleware.bind(this);
    }
    Auth.prototype.SignToken = function (user) {
        return jwt.sign({
            user: user
        }, this.config.SessionSecret, { expiresIn: this.config.SessionTimeout });
    };
    Auth.prototype.ValidateToken = function (token) {
        if (!token) {
            return false;
        }
        try {
            var decodedToken = jwt.verify(token, this.config.SessionSecret);
            if (typeof decodedToken === "object" && decodedToken !== null) {
                return this.UserHasRole(decodedToken["user"]);
            }
            return false;
        }
        catch (_a) {
            return false;
        }
    };
    Auth.prototype.UserHasRole = function (user) {
        return this.config.Roles.includes(user.role);
    };
    Auth.prototype.GetUser = function (token) {
        if (!token) {
            console.error("Must provide a token to get a user");
            return { "name": "", "role": "", "serverParks": [], "defaultServerPark": "" };
        }
        try {
            var decodedToken = jwt.verify(token, this.config.SessionSecret);
            return decodedToken["user"];
        }
        catch (_a) {
            console.error("Must provide a valid token to get a user");
            return { "name": "", "role": "", "serverParks": [], "defaultServerPark": "" };
        }
    };
    Auth.prototype.GetToken = function (request) {
        var token = request.get("authorization");
        if (!token) {
            token = request.get("Authorization");
        }
        return token;
    };
    Auth.prototype.Middleware = function (request, response, next) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                if (!this.ValidateToken(this.GetToken(request))) {
                    return [2 /*return*/, response.status(403).json()];
                }
                next();
                return [2 /*return*/];
            });
        });
    };
    return Auth;
}());
export { Auth };
