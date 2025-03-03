import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as session from "express-session";
import { useContainer } from "class-validator";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  useContainer(app.select(AppModule), { fallbackOnErrors: true });
  const configService = app.get(ConfigService);
  const port = configService.get("PORT") || 3000;

  const sessionSecret = configService.get("SESSION_SECRET") || "my-secret";

  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        maxAge: 60000 * 60 * 24, // 1 day
        secure: process.env.NODE_ENV === "production",
      },
    })
  );

  app.use(cookieParser(sessionSecret));
  app.enableCors();
  app.setGlobalPrefix("api");
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
    })
  );

  const config = new DocumentBuilder()
    .setTitle("INFINIVISTA - Feed API")
    .setDescription("API for feed module")
    .setVersion("1.0")
    .addBearerAuth({ type: "http", scheme: "bearer", bearerFormat: "JWT" })
    .addCookieAuth("token")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/swagger-docs", app, document);

  await app.listen(port);
}
bootstrap();
