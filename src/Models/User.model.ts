

//Model/User.model.ts
import {
  Table,
  Column,
  Model,
  DataType,
  PrimaryKey,
  Unique,
  IsEmail,
  CreatedAt,
  UpdatedAt,
  HasMany,
  BeforeValidate,  
  BeforeCreate,
  BeforeUpdate
} from "sequelize-typescript";
import Post from "./Post.model"; 
import { v4 as uuidv4 } from "uuid"; 

@Table({
  tableName: "users",
  timestamps: true,
})
export default class User extends Model {

  @Unique
  @Column({
    type: DataType.UUID,
    defaultValue: uuidv4, 
    allowNull: false,
  })
  userId!: string; // ✅ New Unique User ID

  @PrimaryKey
  @Unique
  @Column({
    type: DataType.STRING(150),
    allowNull: false,
    validate: {
      notContains: " ", // ✅ Prevent spaces in the username
      isLowercase: true, 
    },
  })
  username!: string;

  @IsEmail
  @Unique
  @Column(DataType.STRING(150))
  email!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
    unique: true,
  })
  phone!: string | null;

  @Column({
    type: DataType.ARRAY(DataType.JSON),
    defaultValue: [],
  })
  reportedUsers!: {
    userId: string;
    reason: string;
  }[];
  
  // @Column({
  //   type: DataType.BOOLEAN,
  //   defaultValue: false,
  // })
  // isBanned!: boolean;

  // @Column({
  //   type: DataType.BOOLEAN,
  //   defaultValue: false,
  // })
  // blockedByAdmin!: boolean;
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: "is_banned", 
  })
  isBanned!: boolean;
  
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false,
    field: "blockedByAdmin",
  })
  blockedByAdmin!: boolean;
  
  
  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  reportsReceived!: {
    reporterId: string;
    reason: string;
    reportedAt: string;
  }[];
  
  @Column(DataType.STRING(500))
  fullname!: string;

  @Column(DataType.STRING(150))  
  anonymousName!: string | null; 

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false, // ✅ Default: User is not anonymous
  })
  isAnonymous!: boolean;

  @Column(DataType.ARRAY(DataType.TEXT)) // ✅ New interests column
  interests!: string[];

  @Column({
    type: DataType.INTEGER,
    defaultValue: 100, // ✅ Every user starts with base 100 Vibe Score
  })
  vibeScore!: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0,
  })
  vibeCount!: number;

  @Column({
    type: DataType.ARRAY(DataType.STRING), // Store blocked user IDs as an array
    defaultValue: [],
  })
  blockedUsers!: string[];
  
  @Column({
    type: DataType.ARRAY(DataType.STRING), // ✅ Store accepted chat IDs as an array
    defaultValue: [],
  })
  acceptedChats!: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING), // ✅ Store blocked chat IDs
    defaultValue: [],
  })
  blockedChats!: string[];
  @Column({
    type: DataType.INTEGER,
    defaultValue: 0, // ✅ Track how many comments the user has made today
    allowNull: false
})
dailyCommentCount!: number;

@Column({
    type: DataType.STRING, // ✅ Store the last comment date in YYYY-MM-DD format
    allowNull: true
})
lastCommentUpdate!: string | null;

  
@Column({
  type: DataType.INTEGER,
  allowNull: false,
  defaultValue: 0,
})
couponVibePoints!: number;

@Column({
  type: DataType.STRING, // Store as "YYYY-MM-DD"
  allowNull: true,
})
couponRewardDate!: string | null;


  @Column({
    type: DataType.STRING,
    defaultValue: "Runner",  // Default rank
  })
  rank!: string;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0, // ✅ New Column to Track Post Count
  })
  postCount!: number;

  @Column(DataType.STRING(500))
  bio!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING), // ✅ Store answers as an array of strings
    allowNull: true,
  })
  personality_type!: string[] | null;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false, // ✅ Default value is false
  })
  hasAnsweredPersonality!: boolean;

//   @Column({
//     type: DataType.INTEGER,
//     defaultValue: 0, // ✅ Default: No daily points initially
//     allowNull: false
// })
// dailyVibePoints!: number;

// @Column({
//     type: DataType.STRING, // Store date as a string (YYYY-MM-DD)
//     allowNull: true
// })
// lastVibeUpdate!: string | null;
@Column({
  type: DataType.JSONB, // ✅ Store as JSON
  defaultValue: {}, // ✅ Default to an empty object
  allowNull: false
})
dailyVibePoints!: Record<string, number>;

@Column({
  type: DataType.STRING, // ✅ Store the last vibe update date
  allowNull: true
})
lastVibeUpdate!: string | null;


  @Column(DataType.ARRAY(DataType.TEXT))
  following!: string[];

  @Column(DataType.ARRAY(DataType.TEXT))
  followers!: string[];

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0, // ✅ Default follower count is 0
    allowNull: false,
  })
  followers_count!: number;

  @Column(DataType.STRING(500))
  profile!: string;

  @Column(DataType.STRING(255))
  anonymousProfile!: string | null; // ✅ New Column for Anonymous Profile Image

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    defaultValue: [],
  })
  pending_requests!: string[];

  @Column(DataType.STRING(500))
  clerkId!: string;

  // ✅ For chat
  @Column({
    type: DataType.ARRAY(DataType.JSON),
    allowNull: false,
    defaultValue: [],
  })
  chatRequests!: { 
    senderId: string;
    senderName: string;
    isAnonymous: boolean;
    anonymousProfile?: string | null;  
    greetingMessage?: string;
    sharedPost?: { postId: number; caption: string; media: string[] };
  }[];

  @CreatedAt
  @Column({
    type: DataType.DATE,
    field: "createdAt", // ✅ Force correct column name
  })
  createdAt!: Date;

  @UpdatedAt
  @Column({
    type: DataType.DATE,
    field: "updatedAt", // ✅ Force correct column name
  })
  updatedAt!: Date;

  // ✅ Define relationship: One User has Many Posts
  @HasMany(() => Post, { foreignKey: "author", sourceKey: "username", onDelete: "CASCADE" })
  posts!: Post[];

  // ✅ Before saving, remove spaces and convert username to lowercase
  @BeforeValidate
  static formatUsername(user: User) {
    if (user.username) {
      user.username = user.username.replace(/\s+/g, "").toLowerCase();
    }
  }
}
