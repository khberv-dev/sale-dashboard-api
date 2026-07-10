import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
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
import { Call } from '@shared/entities/call.entity';
import { Team } from '@shared/entities/team.entity';
import { PlanHistory } from '@shared/entities/plan-history.entity';
import { PositionHistory } from '@shared/entities/position-history.entity';
import { UserPosition } from '@shared/enum/user-position.enum';

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

  @Column({ type: 'enum', enum: UserPosition, default: UserPosition.JUNIOR })
  position: UserPosition;

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

  @OneToMany(() => Call, (call) => call.user)
  calls: Call[];

  @OneToMany(() => Attendance, (attendance) => attendance.user)
  attendances: Attendance[];

  @OneToMany(() => SalaryBonus, (salaryBonus) => salaryBonus.user)
  bonuses: SalaryBonus[];

  @OneToMany(() => PlanHistory, (planHistory) => planHistory.user)
  planHistory: PlanHistory[];

  @OneToMany(() => PositionHistory, (positionHistory) => positionHistory.user)
  positionHistory: PositionHistory[];

  @OneToOne(() => CrmProfile, (crmProfile) => crmProfile.user)
  crmProfile: CrmProfile;

  @ManyToOne(() => Team, (team) => team.members)
  @JoinColumn({ name: 'team_id' })
  team: Team;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
