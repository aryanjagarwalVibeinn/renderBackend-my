"use strict";
//Config/clerksetup.ts
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const tslib_1 = require("tslib");
const clerk_sdk_node_1 = require("@clerk/clerk-sdk-node");
const dotenv_1 = (0, tslib_1.__importDefault)(require("dotenv"));
dotenv_1.default.config();
if (!process.env.CLERK_SECRET_KEY || !process.env.CLERK_PUBLISHABLE_KEY) {
    throw new Error("❌ Clerk API keys are missing. Check your .env file.");
}
// ✅ Use Clerk’s built-in authentication (without secretKey)
exports.authenticate = (0, clerk_sdk_node_1.ClerkExpressWithAuth)();
//# sourceMappingURL=clerksetup.js.map