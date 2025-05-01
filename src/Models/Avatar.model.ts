import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    Unique,
    CreatedAt,
    UpdatedAt
  } from "sequelize-typescript";
  
  @Table({
    tableName: "avatars",
    timestamps: true,
  })
  export default class Avatar extends Model {
    
    @PrimaryKey
    @Unique
    @Column({
      type: DataType.UUID,
      defaultValue: DataType.UUIDV4,
    })
    avatarId!: string;
  
    @Unique
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    avatarUrl!: string;
  
    @CreatedAt
    @Column(DataType.DATE)
    createdAt!: Date;
    
    @UpdatedAt
    @Column(DataType.DATE)
    updatedAt!: Date;
  }
  