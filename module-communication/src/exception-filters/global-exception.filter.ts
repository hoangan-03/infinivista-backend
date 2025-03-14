import {
    ArgumentsHost,
    BadRequestException,
    Catch,
    ExceptionFilter,
    HttpException,
    ValidationError,
} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {Response} from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
    constructor(private readonly config_service: ConfigService) {}

    private formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
        const formattedErrors: Record<string, string[]> = {};

        errors.forEach((error) => {
            if (error.constraints) {
                formattedErrors[error.property] = Object.values(error.constraints);
            }

            if (error.children?.length) {
                const childErrors = this.formatValidationErrors(error.children);
                Object.keys(childErrors).forEach((key) => {
                    formattedErrors[`${error.property}.${key}`] = childErrors[key];
                });
            }
        });

        return formattedErrors;
    }

    private formatStackAsArray(stack: string): any[] {
        if (!stack) return [];

        // Split the stack trace into lines
        const lines = stack.split('\n');

        // Process each stack frame
        return lines.map((line) => {
            // Extract file path, line, and column information
            const match = line.match(/\s*at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
            if (match) {
                const [, functionName, filePath, lineNumber, columnNumber] = match;
                // Return structured information about the stack frame
                return {
                    function: functionName,
                    file: filePath,
                    line: parseInt(lineNumber),
                    column: parseInt(columnNumber),
                };
            }
            // If it doesn't match the pattern, it might be the error message or another format
            return {text: line.trim()};
        });
    }

    private formatTimestampGMT7(date: Date): string {
        // Create formatter for GMT+7 timezone (Bangkok, Hanoi, Jakarta)
        const options: Intl.DateTimeFormatOptions = {
            timeZone: 'Asia/Bangkok',
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: false,
        };

        // Format the date using the Thai locale and GMT+7 timezone
        const formatter = new Intl.DateTimeFormat('en-US', options);

        // Return formatted date string with explicit GMT+7 indicator
        return formatter.format(date) + ' (GMT+7)';
    }

    catch(exception: any, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const status = exception instanceof HttpException ? exception.getStatus() : 500;
        const timestamp = new Date();

        const errorResponse: any = {
            statusCode: status,
            timestamp: this.formatTimestampGMT7(timestamp),
            timestampISO: timestamp.toISOString(),
        };

        if (exception instanceof BadRequestException) {
            const exceptionResponse = exception.getResponse() as any;

            if (Array.isArray(exceptionResponse.message)) {
                const validationErrors: Record<string, string[]> = {};
                exceptionResponse.message.forEach((message: string) => {
                    const matches = message.match(/^The\s+(\w+)\s+(.+)$/);
                    if (matches) {
                        const [, field, error] = matches;
                        if (!validationErrors[field]) {
                            validationErrors[field] = [];
                        }
                        validationErrors[field].push(error);
                    } else {
                        // For messages that don't match the pattern, add them under a generic key
                        if (!validationErrors['general']) {
                            validationErrors['general'] = [];
                        }
                        validationErrors['general'].push(message);
                    }
                });

                errorResponse.errors = validationErrors;
                errorResponse.message = 'Validation failed';
            } else {
                errorResponse.message = exceptionResponse.message || 'Bad request';
            }
        } else {
            errorResponse.message = exception.message || 'Internal server error';
        }

        // Add stack trace if not in production
        if (this.config_service.get('NODE_ENV') !== 'production') {
            // Use array format instead of string with newlines
            errorResponse.stackFrames = exception.stack ? this.formatStackAsArray(exception.stack) : [];
        }

        response.status(status).json({
            error: errorResponse,
        });
    }
}
