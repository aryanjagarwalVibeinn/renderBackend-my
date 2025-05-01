//Model/CouponVendor.model.ts
import {
    Table,
    Column,
    Model,
    DataType,
    PrimaryKey,
    CreatedAt,
    UpdatedAt,
  } from "sequelize-typescript";
  
  @Table({
    tableName: "coupon_vendors",
    timestamps: true,
  })
  export default class CouponVendor extends Model {
    @PrimaryKey
    @Column(DataType.STRING)
    vendorId!: string; // Unique ID like "ZOMATO01", "AMZN", etc.
  
    @Column({
      type: DataType.STRING,
      allowNull: false,
    })
    name!: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    logoUrl!: string;
  
    @Column({
      type: DataType.STRING,
      allowNull: true,
    })
    contactEmail!: string;
  
    @CreatedAt
    createdAt!: Date;
  
    @UpdatedAt
    updatedAt!: Date;
  }
  