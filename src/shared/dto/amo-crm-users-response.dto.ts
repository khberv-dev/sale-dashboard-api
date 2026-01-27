import { AmoCrmBasicResponse } from '@shared/dto/amo-crm-basic-response';

export interface AmoCrmUser {
  id: number;
  name: string;
  email: string;
}

export class AmoCrmUsersResponse extends AmoCrmBasicResponse<{ users: AmoCrmUser[] }> {}
