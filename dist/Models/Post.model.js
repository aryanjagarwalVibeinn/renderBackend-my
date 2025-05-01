"use strict";
//Models/post.model.ts
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const User_model_1 = (0, tslib_1.__importDefault)(require("./User.model"));
let Post = class Post extends sequelize_typescript_1.Model {
};
(0, tslib_1.__decorate)([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    (0, tslib_1.__metadata)("design:type", Number)
], Post.prototype, "id", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.TEXT),
        allowNull: false
    }),
    (0, tslib_1.__metadata)("design:type", Array)
], Post.prototype, "media", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false
    }),
    (0, tslib_1.__metadata)("design:type", String)
], Post.prototype, "caption", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.ForeignKey)(() => User_model_1.default),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(150),
        allowNull: false
    }),
    (0, tslib_1.__metadata)("design:type", String)
], Post.prototype, "author", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(150),
        allowNull: false
    }),
    (0, tslib_1.__metadata)("design:type", String)
], Post.prototype, "displayAuthor", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.BelongsTo)(() => User_model_1.default, { foreignKey: "author", targetKey: "username", onDelete: "CASCADE" }),
    (0, tslib_1.__metadata)("design:type", User_model_1.default)
], Post.prototype, "user", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.TEXT),
        defaultValue: [],
    }),
    (0, tslib_1.__metadata)("design:type", Array)
], Post.prototype, "likes", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.JSON,
        defaultValue: [],
    }),
    (0, tslib_1.__metadata)("design:type", Object)
], Post.prototype, "comments", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(50),
        allowNull: false,
        defaultValue: "everyone"
    }),
    (0, tslib_1.__metadata)("design:type", String)
], Post.prototype, "visibility", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(100),
        allowNull: false,
        defaultValue: "general" // Default category
    }),
    (0, tslib_1.__metadata)("design:type", String)
], Post.prototype, "post_category", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.INTEGER,
        allowNull: false,
        defaultValue: 0, // Default value is 0
    }),
    (0, tslib_1.__metadata)("design:type", Number)
], Post.prototype, "views", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.ARRAY(sequelize_typescript_1.DataType.STRING),
        defaultValue: []
    }),
    (0, tslib_1.__metadata)("design:type", Array)
], Post.prototype, "viewedUsers", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.CreatedAt,
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
        defaultValue: sequelize_typescript_1.DataType.NOW,
        field: "created_at",
    }),
    (0, tslib_1.__metadata)("design:type", Date)
], Post.prototype, "createdAt", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.UpdatedAt,
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
        defaultValue: sequelize_typescript_1.DataType.NOW,
        field: "updated_at",
    }),
    (0, tslib_1.__metadata)("design:type", Date)
], Post.prototype, "updatedAt", void 0);
Post = (0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Table)({
        tableName: "posts",
        timestamps: true,
        underscored: true,
    })
], Post);
exports.default = Post;
//# sourceMappingURL=Post.model.js.map