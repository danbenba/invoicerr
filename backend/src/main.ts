import * as bodyParser from 'body-parser';
import { join } from 'path';

import { AppModule } from './app.module';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, { bodyParser: false });
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:5173', process.env.APP_URL, ...(process.env.CORS_ORIGINS?.split(',').map(o => o.trim()) || [])].filter((origin): origin is string => typeof origin === 'string' && origin !== ''),
  });
  app.setGlobalPrefix('api');
  
  // Serve static files from public directory (for avatars)
  app.useStaticAssets(join(process.cwd(), 'public'), {
    prefix: '/',
  });
  
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
