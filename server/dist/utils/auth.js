"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
class AuthManager {
}
_a = AuthManager;
AuthManager.isAuthenticated = () => __awaiter(void 0, void 0, void 0, function* () {
    const data = yield chrome.storage.local.get('authToken');
    const authToken = data.authToken;
    console.log("Token retrieved: ", authToken);
    const authenticated = authToken !== undefined && authToken !== null;
    // DEBUG
    console.log("isAuthenticated: ", authenticated);
    return [authenticated, authToken];
});
AuthManager.setAuthTokenAsync = (token) => __awaiter(void 0, void 0, void 0, function* () {
    yield chrome.storage.local.set({ authToken: token }, () => {
        console.log("Token stored: ", token);
    });
});
AuthManager.authenticate = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Authenticating...");
    const authToken = yield chrome.identity.getAuthToken({ interactive: true });
    yield _a.setAuthTokenAsync(authToken);
    console.log("Authenticated! Token: ", authToken);
    // DEBUG
    const [_, resToken] = yield _a.isAuthenticated();
    console.log("Logged in. Auth:", resToken);
    return authToken.token;
});
AuthManager.getUserEmail = () => __awaiter(void 0, void 0, void 0, function* () {
    return new Promise((resolve, reject) => {
        chrome.identity.getProfileUserInfo((info) => {
            console.log(info.email);
            resolve(info.email);
        });
    });
});
AuthManager.logout = () => __awaiter(void 0, void 0, void 0, function* () {
    console.log("Logging out...");
    yield chrome.storage.local.remove('authToken');
    // DEBUG
    const [_, authToken] = yield _a.isAuthenticated();
    console.log("User logged out. Auth:", authToken);
});
exports.default = AuthManager;
