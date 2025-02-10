import { CreateDateColumn, UpdateDateColumn } from "typeorm";
import { ApiProperty } from "@nestjs/swagger";

export abstract class BaseEntity {
  @ApiProperty({
    example: "2024-01-22T12:00:00Z",
    description: "Entity creation timestamp",
  })
  @CreateDateColumn({ type: "timestamp" })
  createdAt: Date;

  @ApiProperty({
    example: "2024-01-22T12:00:00Z",
    description: "Entity last update timestamp",
  })
  @UpdateDateColumn({ type: "timestamp" })
  updatedAt: Date;
}