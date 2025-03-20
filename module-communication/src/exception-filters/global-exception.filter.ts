import {ArgumentsHost, BadRequestException, Catch, ExceptionFilter, HttpException, Logger} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Response} from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(GlobalExceptionFilter.name);

    constructor(private readonly config_service: ConfigService) {}

    private formatTimestamp(): string {
        const now = new Date();
        const gmtPlus7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
        const day = String(gmtPlus7.getUTCDate()).padStart(2, '0');
        const month = String(gmtPlus7.getUTCMonth() + 1).padStart(2, '0');
        const year = gmtPlus7.getUTCFullYear();
        const hours = String(gmtPlus7.getUTCHours()).padStart(2, '0');
        const minutes = String(gmtPlus7.getUTCMinutes()).padStart(2, '0');
        const seconds = String(gmtPlus7.getUTCSeconds()).padStart(2, '0');

        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }

    catch(exception: any, host: ArgumentsHost) {
        this.logger.error(exception);

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception instanceof HttpException ? exception.getStatus() : 500;

        const errorResponse: any = {
            statusCode: status,
            timestamp: this.formatTimestamp(),
            message: 'Internal server error',
        };

        if (exception instanceof BadRequestException) {
            const exceptionResponse = exception.getResponse() as any;

            errorResponse.message = exceptionResponse.message || 'Bad request';

            if (exceptionResponse.errors) {
                errorResponse.errors = exceptionResponse.errors;
            } else if (Array.isArray(exceptionResponse.message)) {
                try {
                    const validationErrors = {};
                    exceptionResponse.message.forEach((message: string) => {
                        const matches = message.match(/([a-zA-Z0-9.]+) (.+)/);
                        if (matches && matches.length >= 3) {
                            const [, field, error] = matches;
                            validationErrors[field] = error;
                        } else {
                            if (!validationErrors['general']) validationErrors['general'] = [];
                            validationErrors['general'].push(message);
                        }
                    });

                    errorResponse.errors = validationErrors;
                } catch (e) {
                    errorResponse.errors = {message: exceptionResponse.message};
                }
            }
        } else if (exception instanceof HttpException) {
            const exceptionResponse = exception.getResponse() as any;
            errorResponse.message = exceptionResponse.message || exception.message;
        } else {
            errorResponse.message = exception.message || 'Internal server error';
        }

        // if (this.config_service.get('NODE_ENV') !== 'production') {
        //   errorResponse.stack = exception.stack;
        // }

        response.status(status).json(errorResponse);
    }
}
