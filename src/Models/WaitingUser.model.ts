// WaitingUser model
// Models/WaitingUser.model.ts

import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Unique,
    CreatedAt,
    ForeignKey,
    BelongsTo,
  } from "sequelize-typescript";
  import { v4 as uuidv4 } from "uuid";
  import User from "./User.model";
  
  @Table({
    tableName: "waiting_users",
    timestamps: true,
  })
  export default class WaitingUser extends Model {
    @PrimaryKey
    @Unique
    @Column({
      type: DataType.UUID,
      defaultValue: uuidv4,
      allowNull: false,
    })
    id!: string;

    @ForeignKey(() => User)
@Column({
  type: DataType.UUID,
  allowNull: false,
})
userId!: string;
  
@BelongsTo(() => User, {
    foreignKey: "userId",     // 👈 explicitly link to this
    targetKey: "userId"       // 👈 and match it with `userId` in User model (not PK)
  })
  user!: User;
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    interest!: string;
  
    @CreatedAt
    @Column({
      type: DataType.DATE,
      field: "createdAt",
    })
    createdAt!: Date;
  }
  