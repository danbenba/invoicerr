import * as bodyParser from 'body-parser';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:5173', process.env.APP_URL, ...(process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [])].filter(Boolean),
  });
  app.setGlobalPrefix('api');
  app.use(bodyParser.json({ limit: '20mb' }));
  app.use(bodyParser.urlencoded({ limit: '20mb', extended: true }));
  app.use(cookieParser());
  app.use((_req, res, next) => {
    res.header('Access-Control-Expose-Headers', 'WWW-Authenticate');
    next();
  });
  await app.listen(process.env.PORT || 3000);
}
bootstrap();
