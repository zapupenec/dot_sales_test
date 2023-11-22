import {
  Controller,
  Get,
  Logger,
  Query,
  Redirect,
  ValidationPipe,
} from '@nestjs/common';
import { AppService } from './app.service';
import { AppDto } from './dto/app.dto';

// https://35d3-188-243-183-246.ngrok-free.app
// https://www.amocrm.ru/oauth?client_id=d2ef3bf6-86c0-4777-a914-6bc6899f0df2&mode=post_message

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}
  private readonly logger = new Logger(AppController.name);

  @Get('/')
  @Redirect(
    `https://www.amocrm.ru/oauth?client_id=${process.env.AMOCRM_ID}&mode=post_message`,
    301,
  )
  redirect() {}

  @Get('oauth')
  async getAuth(@Query() params) {
    await this.appService.requestTokenData(params);
  }

  @Get('/leads')
  async exampleMethod(@Query(new ValidationPipe()) params: AppDto) {
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
