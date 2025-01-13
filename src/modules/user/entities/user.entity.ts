import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn, BeforeInsert, BeforeUpdate } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';
import { Exclude } from 'class-transformer';
@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ type: 'varchar', length: 255 })
  email: string;

  @Column({ type: 'varchar', length: 255 })
  username: string;

  @Column({ type: 'varchar', length: 255 })
  password?: string;

  @Column({ type: 'varchar', length: 15, nullable: true })
  phoneNumber: string;

  @Column({ type: 'date', nullable: true })
  dob: Date;

  @Column({ type: 'boolean', nullable: true })
  gender: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true  })
  firstName: string;

  @Column({ type: 'varchar', length: 255, nullable: true  })
  lastName: string;

  @Column({ type: 'text', nullable: true })
  profileImageUrl: string;

  @Column({ type: 'text', nullable: true })
  coverImageUrl: string;

  @Column({ type: 'boolean', default: false , nullable: true })
  isOnline: boolean;

  @Column({ type: 'boolean', default: false, nullable: true  })
  isSuspended: boolean;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;

  constructor(data: Partial<User> = {}) {
    Object.assign(this, data);
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword(): Promise<void> {
    const salt = await bcrypt.genSalt();
    if (this.password && !/^\$2[abxy]?\$\d+\$/.test(this.password)) {
      if (this.password) {
        this.password = await bcrypt.hash(this.password, salt);
      }
    }
  }

  async checkPassword(plainPassword: string): Promise<boolean> {
    return this.password ? await bcrypt.compare(plainPassword, this.password) : false;
  }
}