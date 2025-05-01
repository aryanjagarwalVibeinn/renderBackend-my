//Models /KanbanImage.model.ts
import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    PrimaryKey,
    AutoIncrement,
    CreatedAt,
    UpdatedAt,
  } from "sequelize-typescript";
  import KanbanCard from "./KanbanCard.model";
  
  @Table({ tableName: "kanban_images", timestamps: true })
  export default class KanbanImage extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id!: number;
  
    @Column(DataType.STRING)
    imageUrl!: string;
  
    @Column(DataType.STRING)
    subtitle!: string;
  
    @ForeignKey(() => KanbanCard)
    @Column(DataType.BIGINT)
    kanbanCardId!: number;
  
    @BelongsTo(() => KanbanCard)
    card!: KanbanCard;
  
    @CreatedAt
    createdAt!: Date;
  
    @UpdatedAt
    updatedAt!: Date;
  }
  