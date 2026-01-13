import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '@shared/entities/user.entity';
import { SaleType } from '@shared/entities/sale-type.entity';

@Entity('sales')
export class Sale {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  amount: number;

  @Column({ name: 'sale_at' })
  saleAt: Date;

  @Column({ name: 'contract_number', nullable: true })
  contractNumber: string;

  @ManyToOne(() => User, (manager) => manager.sales)
  @JoinColumn({ name: 'manager_id' })
  manager: User;

  @ManyToOne(() => SaleType, (saleType) => saleType.sales)
  @JoinColumn({ name: 'type_id' })
  type: SaleType;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
