import { Table, Column, Model, DataType, ForeignKey, BelongsTo, CreatedAt, UpdatedAt, PrimaryKey, AutoIncrement } from 'sequelize-typescript';
import User from './User.model';

@Table({ tableName: 'vibe_cards', timestamps: true })
export default class VibeCard extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.BIGINT)
  id!: number;

  @Column(DataType.STRING)
  title!: string;

  @Column(DataType.STRING)
  imageUrl!: string;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    references: {
      model: User,
      key: 'userId',
    },
  })
  userId!: string;

  @BelongsTo(() => User, { foreignKey: 'userId', targetKey: 'userId' })
  user!: User;

  @CreatedAt
  createdAt!: Date;

  @UpdatedAt
  updatedAt!: Date;
}