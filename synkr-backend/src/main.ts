import 'reflect-metadata';
import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.setGlobalPrefix('api');
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Synkr API')
    .setDescription('Backend do Synkr (Fases 0 e 1: fundação, autenticação e perfil)')
    .setVersion('0.1.0')
    .addBearerAuth()
    .build();
  SwaggerModule.setup('docs', app, SwaggerModule.createDocument(app, swaggerConfig));

  const port = Number(app.get(ConfigService).get('PORT') ?? 3000);
  // 0.0.0.0 para o telemóvel (Expo Go) conseguir aceder pela rede local
  await app.listen(port, '0.0.0.0');
  Logger.log(`API em http://localhost:${port}/api  |  Swagger em http://localhost:${port}/docs`, 'Bootstrap');
}
bootstrap();
