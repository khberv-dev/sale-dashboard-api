import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@shared/entities/user.entity';
import { SalaryBonusType } from '@shared/enum/salary-bonus-type.enum';

@Entity('salary-bonuses')
export class SalaryBonus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  amount: number;

  @Column({ type: 'enum', enum: SalaryBonusType })
  type: SalaryBonusType;

  @ManyToOne(() => User, (user) => user.bonuses)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column()
  date: Date;
}
