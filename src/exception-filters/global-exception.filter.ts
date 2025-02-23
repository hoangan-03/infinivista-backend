import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  ValidationError,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  constructor(private readonly config_service: ConfigService) {}

  private formatValidationErrors(errors: ValidationError[]): Record<string, string[]> {
    const formattedErrors: Record<string, string[]> = {};
    
    errors.forEach(error => {
      if (error.constraints) {
        formattedErrors[error.property] = Object.values(error.constraints);
      }
      
      if (error.children?.length) {
        const childErrors = this.formatValidationErrors(error.children);
        Object.keys(childErrors).forEach(key => {
          formattedErrors[`${error.property}.${key}`] = childErrors[key];
        });
      }
    });

    return formattedErrors;
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception instanceof HttpException ? exception.getStatus() : 500;

    let errorResponse: any = {
      statusCode: status,
      timestamp: new Date().toISOString(),
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
          }
        });
        
        errorResponse.errors = validationErrors;
      } else {
        errorResponse.message = exceptionResponse.message;
      }
    } else {
      errorResponse.message = exception.message || 'Internal server error';
    }

    if (this.config_service.get('NODE_ENV') !== 'production') {
      errorResponse.stack = exception.stack;
    }

    response.status(status).json({
      error: errorResponse
    });
  }
}