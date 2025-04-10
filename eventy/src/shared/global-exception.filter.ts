import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ERROR_MESSAGES } from './constants';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === 'P2002') {
        const fields = Array.isArray(exception.meta?.target)
          ? exception.meta?.target.join(', ')
          : 'unknown';
        return response.status(HttpStatus.CONFLICT).json({
          statusCode: HttpStatus.CONFLICT,

          message: `${ERROR_MESSAGES.UNIQUE_CONSTRAINT_FAILED} (${fields})`,
          error: 'Conflict',
        });
      }

      if (exception.code === 'P2025') {
        return response.status(HttpStatus.NOT_FOUND).json({
          statusCode: HttpStatus.NOT_FOUND,
          message: ERROR_MESSAGES.RESOURCE_NOT_FOUND,
          error: 'Not Found',
          timestamp: new Date().toISOString(),
          path: request.url,
        });
      }
    }

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const errorResponse = exception.getResponse();

      const formattedErrorResponse =
        typeof errorResponse === 'object' && errorResponse !== null
          ? { ...errorResponse }
          : { message: errorResponse };

      return response.status(status).json({
        ...formattedErrorResponse,
        timestamp: new Date().toISOString(),
        path: request.url,
      });
    }

    return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
      message: ERROR_MESSAGES.INTERNAL_SERVER_ERROR,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
