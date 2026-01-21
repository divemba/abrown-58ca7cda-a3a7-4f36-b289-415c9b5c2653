import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';

@Entity()
export class AuditLog {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  userId!: number;

  @Column()
  action!: string;

  @Column()
  resource!: string;

  @Column({ nullable: true })
  resourceId?: number;

  @Column()
  allowed!: boolean;

  @CreateDateColumn()
  timestamp!: Date;
}
