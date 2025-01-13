import { NestFactory } from "@nestjs/core";
import { AppModule } from "@/app.module";
import { ConfigService } from "@nestjs/config";
import { ValidationPipe } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import * as cookieParser from "cookie-parser";
import * as session from "express-session";
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
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
  app.use(cookieParser("your-secret-key"));
  app.enableCors();

  const port = configService.get("PORT") || 3000;
  app.setGlobalPrefix("api/v1", { exclude: [""] });
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: false,
      forbidNonWhitelisted: false,
    })
  );

  const config = new DocumentBuilder()
    .setTitle("User API")
    .setDescription("API for user registration and login")
    .setVersion("1.0")
    .addTag("users")
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup("api/v1/swaggerdocs", app, document);

  await app.listen(port);
}
bootstrap();
