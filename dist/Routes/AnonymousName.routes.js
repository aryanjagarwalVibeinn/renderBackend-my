"use strict";
//Routes/AnonymousName.routes.ts
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const express_1 = (0, tslib_1.__importDefault)(require("express"));
const AnonymousName_controller_1 = require("../Controller/AnonymousName.controller");
const clerksetup_1 = require("../Config/clerksetup");
const router = express_1.default.Router();
router.get('/api/anony/generateName', clerksetup_1.authenticate, AnonymousName_controller_1.generateAnonymousName);
exports.default = router;
//# sourceMappingURL=AnonymousName.routes.js.map