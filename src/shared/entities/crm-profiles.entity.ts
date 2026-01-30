import { Column, Entity, JoinColumn, OneToOne, PrimaryColumn } from 'typeorm';
import { User } from '@shared/entities/user.entity';

@Entity('crm-profiles')
export class CrmProfile {
  @PrimaryColumn({ name: 'user_id' })
  userId: string;

  @OneToOne(() => User, (user) => user.crmProfile)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'account_id', nullable: true })
  accountId: string;

  @Column({ name: 'sip_number', nullable: true })
  sipNumber: string;

  @Column({ name: 'lead_count', default: 0 })
  leadCount: number;

  @Column({ name: 'call_duration', default: 0 })
  callDuration: number;
}
