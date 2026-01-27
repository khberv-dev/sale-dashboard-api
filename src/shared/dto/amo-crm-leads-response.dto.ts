import { AmoCrmBasicResponse } from '@shared/dto/amo-crm-basic-response';

export interface AmoCrmLead {
  id: number;
  name: string;
  responsible_user_id: number;
  created_at: number;
}

export class AmoCrmLeadsResponse extends AmoCrmBasicResponse<{ leads: AmoCrmLead[] }> {}
