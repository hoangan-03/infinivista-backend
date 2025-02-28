// import {
//     Entity,
//     PrimaryGeneratedColumn,
//     Column,
//     OneToMany,
//   } from "typeorm";
//   import { ApiProperty } from "@nestjs/swagger";
//   import { Address } from "@/entities/address.entity";
//   import { BaseEntity } from "@/entities/base-class";
  
//   @Entity({ name: "cities" })
//   export class City extends BaseEntity {
//     @ApiProperty({
//       example: "123e4567-e89b-12d3-a456-426614174000",
//       description: "City unique identifier",
//     })
//     @PrimaryGeneratedColumn("uuid")
//     id: string;
  
//     @ApiProperty({
//       example: "Hanoi",
//       description: "City name",
//     })
//     @Column({ type: "varchar", length: 255 })
//     name: string;
  
//     @OneToMany(() => Address, (address) => address.city)
//     addresses: Address[];
//   }
  