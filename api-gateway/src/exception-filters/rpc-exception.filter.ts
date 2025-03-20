// api-gateway/src/exception-filters/rpc-exception.filter.ts
import {ArgumentsHost, Catch, ExceptionFilter, HttpStatus} from '@nestjs/common';
import {Logger} from '@nestjs/common';
import {Response} from 'express';

@Catch()
export class RpcClientExceptionFilter implements ExceptionFilter {
    private readonly logger = new Logger(RpcClientExceptionFilter.name);

    catch(exception: any, host: ArgumentsHost) {
        this.logger.error('RPC exception caught:', exception);

        try {
            this.logger.debug('Error details:', JSON.stringify(exception, null, 2));
        } catch (e) {
            this.logger.debug('Error could not be stringified');
        }

        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();

        // Default values
        let status = HttpStatus.INTERNAL_SERVER_ERROR;
        let message = 'Internal server error';
        let errors: Record<string, string[]> | null = null;
        let timestamp = new Date().toISOString();

        // Handle RabbitMQ specific error structure
        if (exception.err) {
            this.logger.debug('RabbitMQ error detected, err property:', exception.err);
            exception = exception.err;
        }

        // Handle common patterns for microservice exceptions
        if (exception.message && exception.message.includes('timeout')) {
            status = HttpStatus.GATEWAY_TIMEOUT;
            message = 'Service timeout. Please try again later.';
        }

        // Extract error information from RPC error
        if (exception.error) {
            this.logger.debug('Error has error property:', exception.error);
            const error = exception.error;

            // Check if error is a structured object
            if (typeof error === 'object' && error !== null) {
                // First get the message and other metadata
                message = error.message || message;
                errors = error.errors || errors;
                timestamp = error.timestamp || timestamp;

                if (message) {
                    // Determine status code based on message content
                    if (message.includes('not found') || message.includes('does not exist')) {
                        status = HttpStatus.NOT_FOUND;
                    } else if (
                        message.includes('already exists') ||
                        message.includes('taken') ||
                        message.includes('duplicate') ||
                        message.includes('violates unique constraint')
                    ) {
                        status = HttpStatus.CONFLICT;

                        // Add more specific error information
                        if (message.includes('UQ_97672ac88f789774dd47f7c8be3')) {
                            // This appears to be the email constraint
                            message = 'Email address is already registered';
                            errors = {email: ['Email address is already registered']};
                        } else if (message.includes('UQ_')) {
                            // Generic unique constraint
                            message = 'This information is already in use';
                        }
                    } else if (
                        message.includes('invalid') ||
                        message.includes('required') ||
                        message.includes('validation')
                    ) {
                        status = HttpStatus.BAD_REQUEST;
                    } else if (message.includes('unauthorized') || message.includes('credentials')) {
                        status = HttpStatus.UNAUTHORIZED;
                    } else {
                        // Only use the provided status if we couldn't infer a better one
                        status = error.statusCode || status;
                    }
                } else {
                    // No message to analyze, use provided status
                    status = error.statusCode || status;
                }
            }
        }

        // Build the response
        const responseBody = {
            statusCode: status,
            message,
            timestamp,
            path: ctx.getRequest().url,
        };

        if (errors) {
            responseBody['errors'] = errors;
        }

        // Log the response we're sending
        this.logger.log(`Responding with status ${status}: ${message}`);

        // Send the response with the appropriate status code
        response.status(status).json(responseBody);
    }
}
