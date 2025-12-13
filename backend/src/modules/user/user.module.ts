import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { PrismaModule } from '@/prisma/prisma.module';
import { memoryStorage } from 'multer';

@Module({
    imports: [
        PrismaModule,
        MulterModule.register({
            storage: memoryStorage(),
            limits: {
                fileSize: 5 * 1024 * 1024, // 5MB
            },
        }),
    ],
    controllers: [UserController],
    providers: [UserService],
    exports: [UserService],
})
export class UserModule {}
