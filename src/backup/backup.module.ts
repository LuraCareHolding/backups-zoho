import { Module } from '@nestjs/common';
import { BackupController } from './backup.controller';
import { BackupService } from './backup.service';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { ConfigModule } from '../config/config.module';

@Module({
  imports: [AuthModule, EmailModule, ConfigModule],
  controllers: [BackupController],
  providers: [BackupService],
})
export class BackupModule {}