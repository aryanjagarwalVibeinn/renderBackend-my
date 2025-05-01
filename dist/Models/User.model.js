"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// Model/User.model.ts
const sequelize_typescript_1 = require("sequelize-typescript");
const Post_model_1 = (0, tslib_1.__importDefault)(require("./Post.model")); // ✅ Import Post Model
const uuid_1 = require("uuid");
let User = class User extends sequelize_typescript_1.Model {
};
(0, tslib_1.__decorate)([
    sequelize_typescript_1.Unique,
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        defaultValue: uuid_1.v4,
        allowNull: false,
    }),
    (0, tslib_1.__metadata)("design:type", String)
], User.prototype, "userId", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.Unique,
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING(150)),
    (0, tslib_1.__metadata)("design:type", String)
], User.prototype, "username", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.IsEmail,
    sequelize_typescript_1.Unique,
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING(150)),
    (0, tslib_1.__metadata)("design:type", String)
], User.prototype, "email", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING(150)),
    (0, tslib_1.__metadata)("design:type", String)
], User.prototype, "fullname", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING(150)) // ✅ New Column for Anonymous Name
    ,
    (0, tslib_1.__metadata)("design:type", String)
], User.prototype, "anonymousName", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false, // ✅ Default: User is not anonymous
    }),
    (0, tslib_1.__metadata)("design:type", Boolean)
], User.prototype, "isAnonymous", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.TEXT)) // ✅ New interests column
    ,
    (0, tslib_1.__metadata)("design:type", Array)
], User.prototype, "interests", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 100, // ✅ Every user starts with base 100 Vibe Score
    }),
    (0, tslib_1.__metadata)("design:type", Number)
], User.prototype, "vibeScore", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
    }),
    (0, tslib_1.__metadata)("design:type", Number)
], User.prototype, "vibeCount", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING,
        defaultValue: "Runner", // Default rank
    }),
    (0, tslib_1.__metadata)("design:type", String)
], User.prototype, "rank", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0, // ✅ New Column to Track Post Count
    }),
    (0, tslib_1.__metadata)("design:type", Number)
], User.prototype, "postCount", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING(500)),
    (0, tslib_1.__metadata)("design:type", String)
], User.prototype, "bio", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING),
        allowNull: true,
    }),
    (0, tslib_1.__metadata)("design:type", Array)
], User.prototype, "personality_type", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BOOLEAN,
        defaultValue: false, // ✅ Default value is false
    }),
    (0, tslib_1.__metadata)("design:type", Boolean)
], User.prototype, "hasAnsweredPersonality", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.TEXT)),
    (0, tslib_1.__metadata)("design:type", Array)
], User.prototype, "following", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.TEXT)),
    (0, tslib_1.__metadata)("design:type", Array)
], User.prototype, "followers", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        defaultValue: 0,
        allowNull: false,
    }),
    (0, tslib_1.__metadata)("design:type", Number)
], User.prototype, "followers_count", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING(150)),
    (0, tslib_1.__metadata)("design:type", String)
], User.prototype, "profile", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING),
        defaultValue: [],
    }),
    (0, tslib_1.__metadata)("design:type", Array)
], User.prototype, "pending_requests", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING(150)),
    (0, tslib_1.__metadata)("design:type", String)
], User.prototype, "clerkId", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.JSON),
        allowNull: false,
        defaultValue: [],
    }),
    (0, tslib_1.__metadata)("design:type", Array)
], User.prototype, "chatRequests", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.CreatedAt,
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        field: "createdAt", // ✅ Force correct column name
    }),
    (0, tslib_1.__metadata)("design:type", Date)
], User.prototype, "createdAt", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.UpdatedAt,
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        field: "updatedAt", // ✅ Force correct column name
    }),
    (0, tslib_1.__metadata)("design:type", Date)
], User.prototype, "updatedAt", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.HasMany)(() => Post_model_1.default, { foreignKey: "author", sourceKey: "username", onDelete: "CASCADE" }),
    (0, tslib_1.__metadata)("design:type", Array)
], User.prototype, "posts", void 0);
User = (0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Table)({
        tableName: "users",
        timestamps: true,
    })
], User);
exports.default = User;
//# sourceMappingURL=User.model.js.map