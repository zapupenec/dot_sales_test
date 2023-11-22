import { Injectable, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { AppDto } from './dto/app.dto';

@Injectable()
export class AppService {
  constructor(private readonly httpService: HttpService) {}
  private readonly logger = new Logger(AppService.name);
  tokenData: {
    token_type: string;
    expires_in: number | null;
    access_token: string;
    refresh_token: string;
    expiration_time: number | null;
  } | null = null;

  getAuthHeader() {
    return {
      Authorization: `${this.tokenData.token_type} ${this.tokenData.access_token}`,
    };
  }

  async requestTokenData(params) {
    const { code } = params;
    const url = 'https://ramvitalik.amocrm.ru/oauth2/access_token';
    const requestData = {
      client_id: process.env.AMOCRM_ID,
      client_secret: process.env.AMOCRM_SECRET,
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: 'https://35d3-188-243-183-246.ngrok-free.app/oauth',
    };
    const { data } = await this.httpService.post(url, requestData).toPromise();
    this.tokenData = {
      ...data,
      expiration_time: Math.floor(Date.now() / 1000) + data.expires_in,
    };
  }

  async fetchContact(params: AppDto) {
    const { email, phone } = params;

    const fetchContactBy = async (field: 'email' | 'phone', query: string) => {
      const url = `https://ramvitalik.amocrm.ru/api/v4/contacts?query=${query}`;

      const { data } = await this.httpService
        .get(url, { headers: this.getAuthHeader() })
        .toPromise();
      if (!data) {
        return null;
      }

      const contact = data._embedded.contacts.find(
        ({ custom_fields_values }) => {
          const fieldObj = custom_fields_values.find(
            ({ field_code }) => field_code.toLowerCase() === field,
          );

          if (!fieldObj) {
            return false;
          }

          let normalizeQuery = query.toLowerCase();
          if (field === 'phone') {
            normalizeQuery = normalizeQuery.replace(/[+\-()\s]/gi, '');
          }

          return fieldObj.values.some(({ value }) => {
            let normalizeValue = value.toLowerCase();
            if (field === 'phone') {
              normalizeValue = normalizeValue.replace(/[+\-()\s]/gi, '');
            }
            return normalizeValue === normalizeQuery;
          });
        },
      );

      return contact;
    };

    const contactByEmail = await fetchContactBy('email', email);
    const contactByPhone = await fetchContactBy('phone', phone);

    return contactByEmail ?? contactByPhone;
  }

  async createContact(params: AppDto) {
    const { name, email, phone } = params;
    const url = 'https://ramvitalik.amocrm.ru/api/v4/contacts';

    const newContact = {
      name,
      custom_fields_values: [
        {
          field_id: 1443373,
          values: [
            {
              value: email,
            },
          ],
        },
        {
          field_id: 1443371,
          values: [
            {
              value: phone,
            },
          ],
        },
      ],
    };

    const { data } = await this.httpService
      .post(url, [newContact], { headers: this.getAuthHeader() })
      .toPromise();

    return data._embedded.contacts[0].id;
  }

  async updateContact(params: AppDto, id: number) {
    const { name, email, phone } = params;
    const url = `https://ramvitalik.amocrm.ru/api/v4/contacts`;

    const newContact = {
      id,
      name,
      custom_fields_values: [
        {
          field_id: 1443373,
          values: [
            {
              value: email,
            },
          ],
        },
        {
          field_id: 1443371,
          values: [
            {
              value: phone,
            },
          ],
        },
      ],
    };

    const { data } = await this.httpService
      .patch(url, [newContact], { headers: this.getAuthHeader() })
      .toPromise();

    return data.id;
  }

  async createLead(id: number) {
    const url = `https://ramvitalik.amocrm.ru/api/v4/leads`;

    const newLead = {
      _embedded: {
        contacts: [
          {
            id,
          },
        ],
      },
    };

    await this.httpService
      .post(url, [newLead], { headers: this.getAuthHeader() })
      .toPromise();
  }
}
