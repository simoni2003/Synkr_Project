import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsString, Length, Matches, MaxLength, MinLength } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);
const normalizeEmail = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim().toLowerCase() : value);

const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).+$/;
const PASSWORD_MSG = 'A palavra-passe deve ter pelo menos 8 caracteres, com letras e números';

export class RegisterDto {
  @ApiProperty() @Transform(trim) @IsString() @MinLength(2, { message: 'O nome deve ter pelo menos 2 caracteres' }) @MaxLength(80)
  name: string;

  @ApiProperty() @Transform(normalizeEmail) @IsEmail({}, { message: 'E-mail inválido' }) @MaxLength(255)
  email: string;

  @ApiProperty() @IsString() @MinLength(8, { message: PASSWORD_MSG }) @MaxLength(72) @Matches(PASSWORD_RULE, { message: PASSWORD_MSG })
  password: string;
}

export class EmailDto {
  @ApiProperty() @Transform(normalizeEmail) @IsEmail({}, { message: 'E-mail inválido' })
  email: string;
}

export class VerifyEmailDto extends EmailDto {
  @ApiProperty({ example: '123456' }) @Transform(trim) @IsString() @Length(6, 6, { message: 'O código tem 6 dígitos' })
  code: string;
}

export class LoginDto extends EmailDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  password: string;
}

export class RefreshDto {
  @ApiProperty() @IsString() @IsNotEmpty()
  refreshToken: string;
}

export class ResetPasswordDto extends VerifyEmailDto {
  @ApiProperty() @IsString() @MinLength(8, { message: PASSWORD_MSG }) @MaxLength(72) @Matches(PASSWORD_RULE, { message: PASSWORD_MSG })
  newPassword: string;
}
