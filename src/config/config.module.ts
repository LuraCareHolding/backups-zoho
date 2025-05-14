import { Module } from '@nestjs/common';
import { RegionConfigService } from './region-config.service';

@Module({
  providers: [RegionConfigService],
  exports: [RegionConfigService],
})
export class ConfigModule {}