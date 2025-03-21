import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus} from '@nestjs/common';
import {Logger} from '@nestjs/common';
import {Response} from 'express';

import {ApiValidationError} from '@/interfaces/error.interface';

@Catch()
export class RpcExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(RpcExceptionFilter.name);

    catch(exception: ApiValidationError | any, host: ArgumentsHost): void {
        // this.logger.error('RPC exception caught:', exception);

        // try {
        //     this.logger.debug('Error details:', JSON.stringify(exception, null, 2));
        // } catch (e) {
        //     this.logger.debug('Error could not be stringified', e);
        // }

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        const status: number = exception.status || HttpStatus.INTERNAL_SERVER_ERROR;

        response.status(status).json(exception);
    }
}
