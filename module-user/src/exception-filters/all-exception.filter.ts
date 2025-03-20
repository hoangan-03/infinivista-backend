import { Catch, ArgumentsHost, HttpStatus, Logger, Injectable } from '@nestjs/common';
import { RpcException } from '@nestjs/microservices';
import { Observable, throwError } from 'rxjs';
import { BaseExceptionFilter } from '@nestjs/core';

@Catch()
@Injectable()
export class AllExceptionsFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);
  catch(exception: any, host: ArgumentsHost): Observable<any> {
    this.logger.error('This is from all-exception: ' + exception);
    
    const contextType = host.getType();
    
    if (contextType === 'rpc') {
      let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
      let message = 'Internal server error';
      let errors = null;
      
      if (exception instanceof RpcException) {
        return throwError(() => exception);
      }
      
      // HTTP exceptions (like BadRequestException, etc.)
      if (exception.getStatus && typeof exception.getStatus === 'function') {
        statusCode = exception.getStatus();
        const response = exception.getResponse();
        
        if (typeof response === 'object') {
          message = response.message || exception.message;
          errors = response.errors || null;
        } else {
          message = response || exception.message;
        }
      } 
      // Other errors
      else if (exception.message) {
        message = exception.message;
      }
      
      return throwError(() => new RpcException({
        statusCode,
        message,
        errors,
        timestamp: new Date().toISOString()
      }));
    }
    
    // For HTTP contexts (only in hybrid apps)
    super.catch(exception, host);
    return throwError(() => exception);
  }
}