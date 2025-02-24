import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as session from "express-session";
import {useContainer} from "class-validator";
import * as nodeCrypto from 'crypto';

// Polyfill global crypto if not defined
if (!(global as any).crypto) {
  (global as any).crypto = nodeCrypto;
}

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService);
  const port = configService.get("PORT") || 3000;

  app.use(
    session({
      secret: configService.get("SESSION_SECRET") || "my-secret",
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000 * 60 * 24, // 1 day
        secure: process.env.NODE_ENV === "production",
      },
    })
  );
  app.use(cookieParser("secret-key"));
  app.enableCors();
  app.setGlobalPrefix("api/v1", { exclude: [""] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
    })
  );

  const config = new DocumentBuilder()
    .setTitle("INFINIVISTA - User API")
    .setDescription("API for user and auth modules")
    .setVersion("1.0")
    .addTag("users")
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/v1/swagger-docs", app, document);

  
  await app.listen(port);
}
bootstrap();
