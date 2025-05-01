"use strict";
// //Models/KanbanCard.model.ts
// import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
// import User from './User.model';
// import KanbanImage from './KanbanImage.model';
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
// @Table({
//     tableName: 'kanban_cards',
//     timestamps: true
// })
// export default class KanbanCard extends Model {
//     @PrimaryKey
//     @AutoIncrement
//     @Column(DataType.BIGINT)
//     id!: number;
//     @Column({
//         type: DataType.STRING,
//         allowNull: false
//     })
//     title!: string;
//     @ForeignKey(() => User)
//     @Column(DataType.STRING)
//     authorUsername!: string;
//     @BelongsTo(() => User, { foreignKey: 'authorUsername', targetKey: 'username' })
//     author!: User;
//     // ✅ FIX: Define HasMany relationship with KanbanImage
//     @HasMany(() => KanbanImage, { foreignKey: 'kanbanCardId', onDelete: 'CASCADE' })
//     images!: KanbanImage[];
//     @CreatedAt
//     createdAt!: Date;
//     @UpdatedAt
//     updatedAt!: Date;
// }
const sequelize_typescript_1 = require("sequelize-typescript");
const User_model_1 = (0, tslib_1.__importDefault)(require("./User.model"));
const KanbanImage_model_1 = (0, tslib_1.__importDefault)(require("./KanbanImage.model"));
let KanbanCard = class KanbanCard extends sequelize_typescript_1.Model {
};
(0, tslib_1.__decorate)([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    (0, tslib_1.__metadata)("design:type", Number)
], KanbanCard.prototype, "id", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    (0, tslib_1.__metadata)("design:type", String)
], KanbanCard.prototype, "title", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.ForeignKey)(() => User_model_1.default),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.UUID),
    (0, tslib_1.__metadata)("design:type", String)
], KanbanCard.prototype, "userId", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.BelongsTo)(() => User_model_1.default, { foreignKey: "userId", targetKey: "userId" }),
    (0, tslib_1.__metadata)("design:type", User_model_1.default)
], KanbanCard.prototype, "user", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.HasMany)(() => KanbanImage_model_1.default, { foreignKey: "kanbanCardId", onDelete: "CASCADE" }),
    (0, tslib_1.__metadata)("design:type", Array)
], KanbanCard.prototype, "images", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.CreatedAt,
    (0, tslib_1.__metadata)("design:type", Date)
], KanbanCard.prototype, "createdAt", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.UpdatedAt,
    (0, tslib_1.__metadata)("design:type", Date)
], KanbanCard.prototype, "updatedAt", void 0);
KanbanCard = (0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Table)({ tableName: "kanban_cards", timestamps: true })
], KanbanCard);
exports.default = KanbanCard;
//# sourceMappingURL=KanbanCard.model.js.map