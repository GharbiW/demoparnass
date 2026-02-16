import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  const allowedDomains = [
    'parnass.aileane.com',
    'aileane.com',
  ];

  app.enableCors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin) {
        return callback(null, true);
      }

      // Allow localhost for development
      if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
        return callback(null, true);
      }

      // Allow any vercel.app subdomain with "parnass" in the name
      if (origin.includes('.vercel.app') && origin.toLowerCase().includes('parnass')) {
        return callback(null, true);
      }

      // Allow configured domains
      for (const domain of allowedDomains) {
        if (origin.includes(domain)) {
          return callback(null, true);
        }
      }

      // Allow custom origins from env
      if (process.env.CORS_ORIGINS) {
        const customOrigins = process.env.CORS_ORIGINS.split(',').map(o => o.trim());
        if (customOrigins.includes(origin)) {
          return callback(null, true);
        }
      }

      // Reject other origins
      callback(new Error('Not allowed by CORS'));
    },
    methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
    credentials: true,
  });

  // Enable validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  await app.listen(process.env.PORT ?? 3001);
  console.log(
    `🚀 Backend running on http://localhost:${process.env.PORT ?? 3001}`,
  );
}
bootstrap();
