import {
  Controller,
  Get,
  Query,
  Redirect,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AppDto } from './dto/app.dto';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get('/')
  @Redirect(
    `https://www.amocrm.ru/oauth?client_id=${process.env.AMOCRM_ID}&mode=post_message`,
    301,
  )
  redirect() {}

  @Get('/oauth')
  async getAuth(@Query() params) {
    await this.appService.requestTokenData('access', params.code);
  }

  @Get('/leads')
  async createLead(@Query(new ValidationPipe()) params: AppDto) {
    const contact = await this.appService.fetchContact(params);
    let id;
    if (contact) {
      await this.appService.updateContact(params, contact.id);
      id = contact.id;
    } else {
      id = await this.appService.createContact(params);
    }
    await this.appService.createLead(id);
    return `создана сделка для контакта с id ${id}`;
  }
}
