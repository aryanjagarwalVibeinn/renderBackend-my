//Models/UserCoupon.model.ts
import {
    Table,
    Column,
    Model,
    DataType,
    ForeignKey,
    CreatedAt,
    UpdatedAt,
    BelongsTo,
  } from "sequelize-typescript";
  import Coupon from "./Coupon.model";
  
  @Table({
    tableName: "user_coupons",
    timestamps: true,
  })
  export default class UserCoupon extends Model {
    @Column(DataType.STRING)
    userId!: string;
  
    @ForeignKey(() => Coupon)
    @Column(DataType.STRING)
    couponCode!: string;
  
    @BelongsTo(() => Coupon)
    coupon!: Coupon;
  
    @Column(DataType.DATE)
    issuedAt!: Date;
  
    @Column({
      type: DataType.BOOLEAN,
      defaultValue: false,
    })
    isRedeemed!: boolean;
  
    @Column(DataType.DATE)
    redeemedAt!: Date;
  
    @CreatedAt
    createdAt!: Date;
  
    @UpdatedAt
    updatedAt!: Date;
  }
  