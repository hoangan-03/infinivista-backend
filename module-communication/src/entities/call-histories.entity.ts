import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity()
export class CallHistories {
  @PrimaryGeneratedColumn()
  call_id: number;

  @Column({ type: 'timestamp' })
  start_time: Date;

  @Column({ type: 'timestamp' })
  end_time: Date;
}
