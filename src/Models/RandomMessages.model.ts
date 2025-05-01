// RandomMessages model
// Models/RandomMessages.model.ts
import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Default,
    ForeignKey,
    CreatedAt,
    BelongsTo,
  } from "sequelize-typescript";
  import { v4 as uuidv4 } from "uuid";
  import RandomChat from "./RandomChat.model";
  
  @Table({
    tableName: "random_messages",
    timestamps: false,
  })
  export default class RandomMessage extends Model {
    @PrimaryKey
    @Default(uuidv4)
    @Column(DataType.UUID)
    id!: string;
  
    @ForeignKey(() => RandomChat)
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    chatId!: string;
  
    @Column({
      type: DataType.UUID,
      allowNull: false,
    })
    senderId!: string;
  
    @Column({
      type: DataType.TEXT,
      allowNull: false,
    })
    text!: string;
  
    @CreatedAt
    @Column({
      type: DataType.DATE,
      defaultValue: DataType.NOW,
    })
    sentAt!: Date;
  
    @BelongsTo(() => RandomChat, { foreignKey: "chatId" })
    chat!: RandomChat;
  }
  