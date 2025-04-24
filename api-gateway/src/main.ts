import {BadRequestException, ValidationPipe, VersioningType} from '@nestjs/common';
import {ConfigService} from '@nestjs/config';
import {NestFactory} from '@nestjs/core';
import {DocumentBuilder, SwaggerModule} from '@nestjs/swagger';
import {useContainer, ValidationError} from 'class-validator';
import * as compression from 'compression';
import * as cookieParser from 'cookie-parser';
import * as session from 'express-session';

import {AppModule} from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    useContainer(app.select(AppModule), {fallbackOnErrors: true});
    const configService = app.get(ConfigService);
    const port = Number(configService.get<number>('PORT')) || 3000;

    const sessionSecret = configService.getOrThrow<string>('SESSION_SECRET');

    app.use(
        session({
            secret: sessionSecret,
            resave: false,
            saveUninitialized: false,
            cookie: {
                maxAge: 60000 * 60 * 24,
                secure: process.env.NODE_ENV === 'production',
            },
        })
    );

    app.use(cookieParser(sessionSecret));
    app.use(compression());
    app.enableCors({
        origin: 'http://infinivista.com:3000',
        allowedHeaders: ['Content-Type', 'Authorization', 'withCredentials'],
        credentials: true,
    });

    app.setGlobalPrefix('api');

    app.enableVersioning({
        type: VersioningType.URI,
        defaultVersion: '1',
    });

    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            transform: true,
            forbidNonWhitelisted: true,
            transformOptions: {enableImplicitConversion: true},
            exceptionFactory: (validationErrors: ValidationError[] = []) => {
                return new BadRequestException({
                    message: 'Validation failed',
                    errors: validationErrors,
                });
            },
        })
    );

    // Configure Swagger to allow file uploads
    const config = new DocumentBuilder().setTitle('INFINIVISTA - Microservices API').addBearerAuth().build();

    const document = SwaggerModule.createDocument(app, config);

    // Allow Swagger UI to send multipart/form-data
    SwaggerModule.setup('api/swagger-docs', app, document, {
        swaggerOptions: {
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
            persistAuthorization: true,
        },
    });

    await app.listen(port);
}
bootstrap();
