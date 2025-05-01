// Models/RandomChat.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Default,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";

@Table({
  tableName: "random_chats",
  timestamps: true,
})
export default class RandomChat extends Model {
  @PrimaryKey
  @Default(DataType.UUIDV4)
  @Column(DataType.UUID)
  id!: string;

  @Column(DataType.UUID)
  user1!: string;

  @Column(DataType.UUID)
  user2!: string;

  @Column(DataType.STRING)
  interest!: string;

  @Column({
    type: DataType.STRING,
    defaultValue: "random",
  })
  type!: "random";

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true,
  })
  isAccepted!: boolean;

  @CreatedAt
  @Column(DataType.DATE)
  createdAt!: Date;

  @UpdatedAt
  @Column(DataType.DATE)
  updatedAt!: Date;
}
