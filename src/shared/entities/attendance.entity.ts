import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from '@shared/entities/user.entity';

@Entity('attendances')
export class Attendance {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.attendances)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @CreateDateColumn()
  date: Date;
}
