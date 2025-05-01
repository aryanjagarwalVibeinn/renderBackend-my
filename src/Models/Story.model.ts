
//Models/Story.model.ts
import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    BelongsTo,
    CreatedAt,
    PrimaryKey
} from 'sequelize-typescript';
import User from "./User.model"; 

@Table({
    tableName: 'stories',
    timestamps: true, // Enables createdAt & updatedAt fields automatically
})
export default class Story extends Model {
      
    @PrimaryKey
    @Column({
        type: DataType.BIGINT,
        autoIncrement: true,
        allowNull: false
    })
    id!: number; 

    @ForeignKey(() => User)
    @Column({
        type: DataType.UUID,  
        allowNull: false
    })
    userId!: string; 

    @BelongsTo(() => User, { 
        foreignKey: "userId", 
        targetKey: "userId", 
        onDelete: "CASCADE"  // If user is deleted, remove all their stories
    })
    user!: User; // Relationship: Story belongs to User

    @Column({
        type: DataType.STRING(255),
        allowNull: false
    })
    media!: string; 

    @Column({
        type: DataType.STRING(255),
        allowNull: true
    })
    text!: string; 

    @CreatedAt
    @Column({
        type: DataType.DATE,
        allowNull: false,
        defaultValue: DataType.NOW
    })
    createdAt!: Date; // Auto timestamp when story is created

    @Column({
        type: DataType.DATE,
        allowNull: false
    })
    expiresAt!: Date; // Expiration time (e.g., 24 hours later)

}
