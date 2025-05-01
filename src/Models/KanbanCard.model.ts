// //Models/KanbanCard.model.ts
// import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
// import User from './User.model';
// import KanbanImage from './KanbanImage.model';

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

//Models/KanbanCard.model.ts
import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    HasMany,
    CreatedAt,
    UpdatedAt,
    PrimaryKey,
    AutoIncrement,
  } from "sequelize-typescript";
  import User from "./User.model";
  import KanbanImage from "./KanbanImage.model";
  
  @Table({ tableName: "kanban_cards", timestamps: true })
  export default class KanbanCard extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id!: number;
  
    @Column(DataType.STRING)
    title!: string;
  
    @ForeignKey(() => User)
    @Column(DataType.UUID)
    userId!: string; // ✅ Associates Kanban Card with a specific user
  
    @BelongsTo(() => User, { foreignKey: "userId", targetKey: "userId" })
    user!: User;
  
    @HasMany(() => KanbanImage, { foreignKey: "kanbanCardId", onDelete: "CASCADE" })
    images!: KanbanImage[];
  
    @CreatedAt
    createdAt!: Date;
  
    @UpdatedAt
    updatedAt!: Date;
  }
  