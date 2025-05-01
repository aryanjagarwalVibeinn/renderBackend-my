import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    CreatedAt,
    UpdatedAt,
  } from "sequelize-typescript";
  import User from "./User.model";
  import Post from "./Post.model";
  
  @Table({
    tableName: "notifications",
    timestamps: true,
    underscored: true,
  })
  export default class Notification extends Model {
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    type!: string; // Like, Comment, Share
  
    @ForeignKey(() => User)
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    senderId!: string; // User who performed the action
  
    @ForeignKey(() => User)
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    receiverId!: string; // User who receives the notification
  
    @ForeignKey(() => Post)
    @Column({
      type: DataType.INTEGER,
      allowNull: true,
    })
    postId!: number; // Post on which the action happened
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    message!: string; // Notification message
  
    @Column({
      type: DataType.BOOLEAN,
      defaultValue: false,
    })
    isRead!: boolean; // Whether the notification has been read
  
    @CreatedAt
    @Column({
      type: DataType.DATE,
      allowNull: false,
      defaultValue: DataType.NOW,
      field: "created_at",
    })
    createdAt!: Date;
  
    @UpdatedAt
    @Column({
      type: DataType.DATE,
      allowNull: false,
      defaultValue: DataType.NOW,
      field: "updated_at",
    })
    updatedAt!: Date;
  }
  