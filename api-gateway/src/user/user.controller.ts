import {Controller, Get, Inject} from '@nestjs/common';
import {ClientProxy} from '@nestjs/microservices';

@Controller('user')
export class UserController {
    constructor(@Inject('USER_SERVICE') private readonly userServiceClient: ClientProxy) {}

    @Get()
    public async getUsers() {
        // return this.userServiceClient.send();
    }
}
