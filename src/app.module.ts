import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { BackupModule } from './backup/backup.module';
import { AuthModule } from './auth/auth.module';
import { EmailModule } from './email/email.module';
import { ConfigModule } from './config/config.module';

@Module({
  imports: [
    NestConfigModule.forRoot({ isGlobal: true }),
    BackupModule,
    AuthModule,
    EmailModule,
    ConfigModule,
  ],
})
export class AppModule {}