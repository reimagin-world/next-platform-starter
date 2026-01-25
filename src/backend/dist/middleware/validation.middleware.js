"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
// Mock middleware
function validateRequest(schema) {
    return (req, res, next) => next();
}
