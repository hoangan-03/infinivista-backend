import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Message } from '@/entities/message.entity';
 
@Injectable()
export class AppService {
 constructor(
   @InjectRepository(Message) private chatRepository: Repository<Message>,
 ) {}
 async createMessage(message: Message): Promise<Message> {
   return await this.chatRepository.save(message);
 }
 
 async getMessages(): Promise<Message[]> {
   return await this.chatRepository.find();
 }
}