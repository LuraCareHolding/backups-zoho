import { Controller, Post, Body, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import { BackupService } from './backup.service';
import { BackupRequestDto } from './dto/backup-request.dto';
import { BackupResponseDto } from './dto/backup-response.dto';

@Controller('backup')
export class BackupController {
  constructor(private readonly backupService: BackupService) {}

  @Post('request')
  async requestBackup(@Body() body: { region: string }, @Query('apiKey') apiKey: string): Promise<BackupResponseDto> {
    if (apiKey !== process.env.API_KEY) {
      throw new HttpException('API Key no válida', HttpStatus.UNAUTHORIZED);
    }
    if (!body.region || !['spain', 'uk', 'italy'].includes(body.region)) {
      throw new HttpException('Región requerida y válida (spain, uk, italy)', HttpStatus.BAD_REQUEST);
    }
    return this.backupService.requestBackup(body.region);
  }

  @Post('download')
  async downloadBackup(@Body() body: BackupRequestDto, @Query('apiKey') apiKey: string): Promise<BackupResponseDto> {
    if (apiKey !== process.env.API_KEY) {
      throw new HttpException('API Key no válida', HttpStatus.UNAUTHORIZED);
    }
    if (!body.region || !['spain', 'uk', 'italy'].includes(body.region)) {
      throw new HttpException('Región requerida y válida (spain, uk, italy)', HttpStatus.BAD_REQUEST);
    }
    return this.backupService.downloadAndUploadBackup(body);
  }

  @Post('download/all')
  async downloadAllBackups(@Body() body: { outputDir?: string }, @Query('apiKey') apiKey: string) {
    if (apiKey !== process.env.API_KEY) {
      throw new HttpException('API Key no válida', HttpStatus.UNAUTHORIZED);
    }
    return this.backupService.downloadAndUploadAllBackups(body.outputDir || 'temp_backups');
  }

  @Get('status')
  async getStatus(@Query('apiKey') apiKey: string) {
    if (apiKey !== process.env.API_KEY) {
      throw new HttpException('API Key no válida', HttpStatus.UNAUTHORIZED);
    }
    return { status: 'OK', regions: ['spain', 'uk', 'italy'] };
  }
}