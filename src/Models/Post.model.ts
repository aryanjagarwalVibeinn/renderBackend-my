

//Models/post.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  PrimaryKey,
  AutoIncrement
} from "sequelize-typescript";
import User from "./User.model";

@Table({
  tableName: "posts",
  timestamps: true,
  underscored: true,
})
export default class Post extends Model {
  
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id!: number;

  @Column({
    type: DataType.ARRAY(DataType.TEXT),
    allowNull: false
  })
  media!: string[];

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  displayProfile!: string;

  @Column({
    type: DataType.STRING(255),
    allowNull: false
  })
  caption!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.STRING(150),
    allowNull: false
  })
  author!: string;

  @Column({
    type: DataType.STRING(150),
    allowNull: false
  })
  displayAuthor!: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false
  })
  isAnonymousAtActionTime!: boolean;
  

  @BelongsTo(() => User, { foreignKey: "author", targetKey: "username", onDelete: "CASCADE" }) 
  user!: User;

  @Column({
    type: DataType.JSONB, // ✅ Store likes as JSONB
    allowNull: false,
    defaultValue: [],
})
likes!: { 
    userId: string; // ✅ Add userId
    username: string; 
    displayAuthor: string;  
    isAnonymousAtActionTime: boolean;
    profilePic: string;
}[];


  @Column({
    type: DataType.JSONB, // ✅ Store comments as JSON
    allowNull: false,
    defaultValue: [],
  })
  comments!: { 
    username: string;
    displayAuthor: string;  
    profilePic: string;
    isAnonymousAtActionTime: boolean;
    comment: string;
    createdAt: string;
    replies: {
      username: string;
      displayAuthor: string;
      profilePic: string;
      reply: string;
      createdAt: string;
    }[];
  }[];

  @Column({
    type: DataType.STRING(50),
    allowNull: false,
    defaultValue: "everyone"
  })
  visibility!: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: false,
    defaultValue: "general"
  })
  post_category!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  views!: number;

@Column({
    type: DataType.JSONB, // ✅ Store an array of user IDs who viewed the post
    defaultValue: []
})
viewedUsers!: string[];

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
