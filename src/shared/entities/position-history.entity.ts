import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@shared/entities/user.entity';
import { UserPosition } from '@shared/enum/user-position.enum';

@Entity('position-histories')
export class PositionHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'enum', enum: UserPosition })
  position: UserPosition;

  @ManyToOne(() => User, (user) => user.positionHistory)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  date: Date;
}
