import { IsNotEmpty, IsEmail, IsPhoneNumber } from 'class-validator';

export class AppDto {
  @IsNotEmpty({
    message: 'query parameter "name" should not be empty',
  })
  name: string;

  @IsEmail(
    { allow_display_name: false },
    {
      message: 'query parameter "email" must be a valid email',
    },
  )
  @IsNotEmpty({
    message: 'query parameter "email" should not be empty',
  })
  email: string;

  @IsPhoneNumber('RU', {
    message: 'query parameter "phone" must be a valid phone',
  })
  @IsNotEmpty({
    message: 'query parameter "phone" should not be empty',
  })
  phone: string;

  constructor(data: Partial<AppDto>) {
    Object.assign(this, data);
  }
}
