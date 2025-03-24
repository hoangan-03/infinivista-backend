import {ArgumentsHost, Catch, Injectable, Logger} from '@nestjs/common';
import {BaseExceptionFilter} from '@nestjs/core';
import {Observable, throwError} from 'rxjs';

import {ApiValidationError, ValidationErrorDetail, ValidationErrorResponse} from '../interfaces/error.interface';

@Catch()
@Injectable()
export class AllExceptionsFilter extends BaseExceptionFilter {
    private readonly logger = new Logger(AllExceptionsFilter.name);

    catch(exception: ApiValidationError, host: ArgumentsHost): Observable<ApiValidationError> {
        // this.logger.error('This is from all-exception: ' + exception);
        // this.logger.debug('Exception type:', typeof exception);
        // this.logger.debug('Exception details:', JSON.stringify(exception, null, 2));

        const contextType = host.getType();

        if (contextType === 'rpc') {
            const status = exception.status;
            const name = exception.name;
            const message = exception.message;

            const errorObj: ValidationErrorDetail = {
                property: 'server',
                children: [],
                constraints: {
                    [name.replace('Exception', '')]: message,
                },
            };

            const validationResponse: ValidationErrorResponse = {
                message: message,
                errors: [errorObj],
            };

            const errorResponse: ApiValidationError = {
                response: validationResponse,
                status,
                options: {},
                message,
                name,
            };

            return throwError(() => errorResponse);
        }
        return throwError(() => exception);
    }
}
