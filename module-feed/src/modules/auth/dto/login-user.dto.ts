import { IsEmail, IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";
export class LoginUserDTO {
  @ApiProperty({
    example: "test@example.com",
    description: "Email address",
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: "Password123@",
    description: "Password",
  })
  @IsNotEmpty()
  @IsString()
  password: string;
}
