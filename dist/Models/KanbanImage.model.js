"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const tslib_1 = require("tslib");
const sequelize_typescript_1 = require("sequelize-typescript");
const KanbanCard_model_1 = (0, tslib_1.__importDefault)(require("./KanbanCard.model"));
let KanbanImage = class KanbanImage extends sequelize_typescript_1.Model {
};
(0, tslib_1.__decorate)([
    sequelize_typescript_1.PrimaryKey,
    sequelize_typescript_1.AutoIncrement,
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    (0, tslib_1.__metadata)("design:type", Number)
], KanbanImage.prototype, "id", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    (0, tslib_1.__metadata)("design:type", String)
], KanbanImage.prototype, "imageUrl", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.STRING),
    (0, tslib_1.__metadata)("design:type", String)
], KanbanImage.prototype, "subtitle", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.ForeignKey)(() => KanbanCard_model_1.default),
    (0, sequelize_typescript_1.Column)(sequelize_typescript_1.DataType.BIGINT),
    (0, tslib_1.__metadata)("design:type", Number)
], KanbanImage.prototype, "kanbanCardId", void 0);
(0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.BelongsTo)(() => KanbanCard_model_1.default),
    (0, tslib_1.__metadata)("design:type", KanbanCard_model_1.default)
], KanbanImage.prototype, "card", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.CreatedAt,
    (0, tslib_1.__metadata)("design:type", Date)
], KanbanImage.prototype, "createdAt", void 0);
(0, tslib_1.__decorate)([
    sequelize_typescript_1.UpdatedAt,
    (0, tslib_1.__metadata)("design:type", Date)
], KanbanImage.prototype, "updatedAt", void 0);
KanbanImage = (0, tslib_1.__decorate)([
    (0, sequelize_typescript_1.Table)({ tableName: "kanban_images", timestamps: true })
], KanbanImage);
exports.default = KanbanImage;
//# sourceMappingURL=KanbanImage.model.js.map