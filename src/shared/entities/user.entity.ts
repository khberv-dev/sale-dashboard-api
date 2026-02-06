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
import { SalaryBonus } from '@shared/entities/salary-bonus.entity';
import { Attendance } from '@shared/entities/attendance.entity';

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

  @Column({ select: false })
  password: string;

  @Column({ name: 'telegram_id', nullable: true })
  telegramId: string;

  @Column({ name: 'start_work_hour', nullable: true })
  startWorkHour: string;

  @OneToMany(() => Sale, (sale) => sale.manager)
  sales: Sale[];

  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendances: Attendance[];

  @OneToMany(() => SalaryBonus, (salaryBonus) => salaryBonus.user)
  bonuses: SalaryBonus[];

  @OneToOne(() => CrmProfile, (crmProfile) => crmProfile.user)
  crmProfile: CrmProfile;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
