// import {
//   Entity,
//   PrimaryGeneratedColumn,
//   Column,
//   OneToOne,
//   JoinColumn,
//   ManyToOne,
// } from "typeorm";
// import { ApiProperty } from "@nestjs/swagger";
// import { User } from "@/entities/user.entity";
// import { BaseEntity } from "@/entities/base-class";
// import { Country } from "./country.entity";
// import { City } from "./city.entity";

// @Entity({ name: "addresses" })
// export class Address extends BaseEntity {
//   @ApiProperty({
//     example: "123e4567-e89b-12d3-a456-426614174000",
//     description: "Address unique identifier",
//   })
//   @PrimaryGeneratedColumn("uuid")
//   id: string;

//   @ApiProperty({ type: () => User })
//   @OneToOne(() => User, (user) => user.address, { onDelete: "CASCADE" })
//   @JoinColumn({ name: "user_id" })
//   user: User;

//   @Column({ type: "uuid" })
//   user_id: string;

//   @ApiProperty({
//     example: "12345",
//     description: "The postal code of the address",
//   })
//   @Column({ type: "varchar", length: 10 })
//   postal_code: string;

//   @ApiProperty({
//     type: () => Country,
//     description: "The country associated with the address",
//   })
//   @ManyToOne(() => Country, (country) => country.addresses, {
//     onDelete: "CASCADE",
//   })
//   @JoinColumn({ name: "country_id" })
//   country: Country;

//   @Column({ type: "uuid" })
//   country_id: string;

//   @ApiProperty({
//     type: () => City,
//     description: "The city associated with the address",
//   })
//   @ManyToOne(() => City, (city) => city.addresses, { onDelete: "CASCADE" })
//   @JoinColumn({ name: "city_id" })
//   city: City;

//   @Column({ type: "uuid" })
//   city_id: string;

//   @ApiProperty({
//     example: "123 Main St, Apt 4B",
//     description: "Full shipping address string",
//   })
//   @Column({ type: "varchar", length: 255 })
//   shipping_address: string;
// }
