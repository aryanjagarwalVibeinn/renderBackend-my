"use strict";
// import {
//     Table,
//     Column,
//     Model,
//     DataType,
//     ForeignKey,
//     BelongsTo,
//     CreatedAt,
//     UpdatedAt,
//     PrimaryKey
// } from 'sequelize-typescript';
// import User from "./User.model"; // Import User model for foreign key reference
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// @Table({
//     tableName: 'stories',
//     timestamps: true, // Enables createdAt & updatedAt fields automatically
// })
// export default class Story extends Model {
//     @PrimaryKey
//     @Column({
//         type: DataType.BIGINT,
//         autoIncrement: true,
//         allowNull: false
//     })
//     id!: number; // Unique Story ID
//     @ForeignKey(() => User)
//     @Column({
//         type: DataType.UUID,  // ✅ Use UUID for `userId`
//         allowNull: false
//     })
//     userId!: string; // ✅ Store userId instead of just username
//     @ForeignKey(() => User)
//     @Column({
//         type: DataType.STRING(150),
//         allowNull: false
//     })
//     owner!: string; // Foreign Key referencing User.username
//     @BelongsTo(() => User, { 
//         foreignKey: "owner", 
//         targetKey: "username", 
//         onDelete: "CASCADE"  // If user is deleted, remove all their stories
//     })
//     user!: User; // Relationship: Story belongs to User
//     @Column({
//         type: DataType.STRING(255),
//         allowNull: false
//     })
//     media!: string; // URL or path to the story media (image/video)
//     @Column({
//         type: DataType.STRING(255),
//         allowNull: true
//     })
//     text!: string; // Optional text content in the story
//     @CreatedAt
//     @Column({
//         type: DataType.DATE,
//         allowNull: false,
//         defaultValue: DataType.NOW
//     })
//     createdAt!: Date; // Auto timestamp when story is created
//     @Column({
//         type: DataType.DATE,
//         allowNull: false
//     })
//     expiresAt!: Date; // Expiration time (e.g., 24 hours later)
// }
const sequelize_typescript_1 = require("sequelize-typescript");
const User_model_1 = (0, tslib_1.__importDefault)(require("./User.model")); // Import User model for foreign key reference
let Story = class Story extends sequelize_typescript_1.Model {
};
(0, tslib_1.__decorate)([
    sequelize_typescript_1.PrimaryKey,
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.BIGINT,
        autoIncrement: true,
        allowNull: false
    }),
    (0, tslib_1.__metadata)("design:type", Number)
], Story.prototype, "id", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.ForeignKey)(() => User_model_1.default),
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.UUID,
        allowNull: false
    }),
    (0, tslib_1.__metadata)("design:type", String)
], Story.prototype, "userId", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.BelongsTo)(() => User_model_1.default, {
        foreignKey: "userId",
        targetKey: "userId",
        onDelete: "CASCADE" // If user is deleted, remove all their stories
    }),
    (0, tslib_1.__metadata)("design:type", User_model_1.default)
], Story.prototype, "user", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: false
    }),
    (0, tslib_1.__metadata)("design:type", String)
], Story.prototype, "media", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.STRING(255),
        allowNull: true
    }),
    (0, tslib_1.__metadata)("design:type", String)
], Story.prototype, "text", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.CreatedAt,
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false,
        defaultValue: sequelize_typescript_1.DataType.NOW
    }),
    (0, tslib_1.__metadata)("design:type", Date)
], Story.prototype, "createdAt", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)({
        type: sequelize_typescript_1.DataType.DATE,
        allowNull: false
    }),
    (0, tslib_1.__metadata)("design:type", Date)
], Story.prototype, "expiresAt", void 0);
Story = (0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Table)({
        tableName: 'stories',
        timestamps: true, // Enables createdAt & updatedAt fields automatically
    })
], Story);
exports.default = Story;
//# sourceMappingURL=Story.model.js.map