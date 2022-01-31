import { useState } from "react";
export function useToken() {
    var getToken = function () {
        var tokenString = localStorage.getItem("token");
        if (!tokenString) {
            return undefined;
        }
        var userToken = JSON.parse(tokenString);
        return userToken;
    };
    var _a = useState(getToken()), token = _a[0], setToken = _a[1];
    var saveToken = function (userToken) {
        localStorage.setItem("token", JSON.stringify(userToken));
        setToken(userToken);
    };
    return {
        setToken: saveToken,
        token: token
    };
}
