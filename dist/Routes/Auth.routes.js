"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = (0, tslib_1.__importDefault)(require("express"));
const Auth_controller_1 = require("../Controller/Auth.controller");
const router = express_1.default.Router();
const clerksetup_1 = require("../Config/clerksetup");
router.post("/auth/callback", Auth_controller_1.authenticateUser);
router.post("/generateJwt", clerksetup_1.authenticate, Auth_controller_1.generateJwt);
exports.default = router;
//# sourceMappingURL=Auth.routes.js.map