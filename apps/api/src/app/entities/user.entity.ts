import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

export enum UserRole {
  OWNER = 'Owner',
  ADMIN = 'Admin',
  VIEWER = 'Viewer',
}

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column()
  passwordHash!: string;

  @Column({
    type: 'text',
    default: UserRole.VIEWER,
  })
  role!: UserRole;

  @Column()
  organizationId!: number;
}
