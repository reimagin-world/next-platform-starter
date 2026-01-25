"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
// Mock middleware
function authenticate(req, res, next) {
    req.user = { userId: 'mock-user-id' };
    next();
}
