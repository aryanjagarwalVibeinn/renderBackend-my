// Models/QnaCard.model.ts
import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
    AutoIncrement,
  } from "sequelize-typescript";
  import User from "./User.model";
  
  @Table({
    tableName: "qna_cards",
    timestamps: true,
  })
  export default class QnaCard extends Model {
    @PrimaryKey
    @AutoIncrement
    @Column(DataType.BIGINT)
    id!: number;
  
    @ForeignKey(() => User)
    @Column(DataType.STRING)
    userId!: string;
  
    @BelongsTo(() => User)
    user!: User;
  
    @Column(DataType.STRING)
    question!: string;
  
    @Column(DataType.STRING)
    answer!: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
      defaultValue: "General", 
    })
    category!: string;
  
    @CreatedAt
    createdAt!: Date;
  
    @UpdatedAt
    updatedAt!: Date;
  }
  