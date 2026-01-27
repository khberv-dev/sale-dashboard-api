import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from '@shared/enum/user-role.enum';
import { Sale } from '@shared/entities/sale.entity';
import { CrmProfile } from '@shared/entities/crm-profiles.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'first_name' })
  firstName: string;

  @Column({ name: 'last_name', nullable: true })
  lastName: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.MANAGER })
  role: UserRole;

  @Column({ unique: true })
  username: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ type: 'bigint', default: 0 })
  plan: number;

  @Column({ nullable: true })
  avatar: string;

  @Column()
  password: string;

  @OneToMany(() => Sale, (sale) => sale.manager)
  sales: Sale[];

  @OneToOne(() => CrmProfile, (crmProfile) => crmProfile.user)
  crmProfile: CrmProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
