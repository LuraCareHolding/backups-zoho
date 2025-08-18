import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import { google } from 'googleapis';
import { AuthService } from '../auth/auth.service';
import { EmailService } from '../email/email.service';
import { RegionConfigService } from '../config/region-config.service';
import { BackupRequestDto } from './dto/backup-request.dto';
import { BackupResponseDto } from './dto/backup-response.dto';

@Injectable()
export class BackupService {
    constructor(
        private readonly authService: AuthService,
        private readonly emailService: EmailService,
        private readonly configService: RegionConfigService,
    ) { }

    async requestBackup(region: string): Promise<BackupResponseDto> {
        console.log('Iniciando las peticiones para :', region);
        try {
            const { accessToken } = await this.authService.refreshZohoToken(region);
            console.log('Token de Zoho:', accessToken);
            const config = this.configService.getConfig(region);
            const url = `https://www.zohoapis.${config.zohoURLs}/crm/bulk/v7/backup`;
            console.log(`[BackupService][requestBackup] Enviando POST a: ${url}`);

            await axios.post(
                url,
                {},
                {
                    headers: {
                        Authorization: `Zoho-oauthtoken ${accessToken}`,
                        'Content-Type': 'application/json',
                    },
                },
            );
            console.log(`[BackupService][requestBackup] Respuesta de Zoho: ${JSON.stringify(Response)}`);
            const message = `Backup inmediato solicitado para ${region} con éxito.`;
            await this.emailService.sendBackupStatusEmail(region, true, message);
            console.log(`[BackupService][requestBackup] Backup solicitado exitosamente para ${region}`);
            return { success: true, message };
        } catch (error: any) {
            const errorDetails = error.response?.data || error.message;
            const message = `Error al solicitar backup para ${region}: ${error.message} - Details: ${JSON.stringify(errorDetails)}`;
            console.error('Zoho API Error:', {
                status: error.response?.status,
                data: error.response?.data,
                headers: error.response?.headers,
            });
            await this.emailService.sendBackupStatusEmail(region, false, message);
            return { success: false, message };
        }
    }

    async downloadAndUploadBackup({ region, outputDir = 'temp_backups', urls }: BackupRequestDto): Promise<BackupResponseDto> {
        console.log(`[BackupService][downloadAndUploadBackup] Iniciando descarga y subida para región: ${region}, outputDir: ${outputDir}`);
        try {
            let { accessToken: zohoAccessToken, expiresAt } = await this.authService.refreshZohoToken(region);
            console.log(`[BackupService][downloadAndUploadBackup] Token de Zoho inicial obtenido para ${region}, expira en: ${new Date(expiresAt).toISOString()}`);
            console.log(`Token de zoho: ${zohoAccessToken}`);
            const googleAccessToken = await this.authService.refreshGoogleToken();
            console.log(`[BackupService][downloadAndUploadBackup] Token de Google obtenido`);
            const config = this.configService.getConfig(region);

            let allBackupLinks: string[] = [];
            if (urls && (urls.data_links || urls.attachment_links)) {
                allBackupLinks = [...(urls.data_links || []), ...(urls.attachment_links || [])];
                console.log(`[BackupService][download QuantumAndUploadBackup] Usando URLs proporcionadas: ${JSON.stringify(allBackupLinks)}`);
            } else {
                console.log(`[BackupService][downloadAndUploadBackup] Obteniendo URLs de backup desde Zoho para ${region}`);
                const backupData = await axios.get(`https://www.zohoapis.${config.zohoURLs}/crm/bulk/v7/backup/urls`, {
                    headers: { Authorization: `Zoho-oauthtoken ${zohoAccessToken}` },
                });
                allBackupLinks = [...(backupData.data.urls?.data_links || []), ...(backupData.data.urls?.attachment_links || [])];
                console.log(`[BackupService][downloadAndUploadBackup] URLs obtenidas: ${JSON.stringify(allBackupLinks)}`);
            }

            if (!allBackupLinks.length) {
                throw new Error('No se encontraron URLs de backup para descargar.');
            }
            console.log('URLs obtenidas de Zoho:', JSON.stringify(allBackupLinks, null, 2));

            const currentDate = new Date();
            const formattedDate = `${String(currentDate.getDate()).padStart(2, '0')}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${currentDate.getFullYear()}`;
            const backupFolderPath = path.join(outputDir, formattedDate);
            console.log(`[BackupService][downloadAndUploadBackup] Creando carpeta local: ${backupFolderPath}`);
            if (!fs.existsSync(backupFolderPath)) {
                fs.mkdirSync(backupFolderPath, { recursive: true });
                console.log(`[BackupService][downloadAndUploadBackup] Carpeta creada: ${backupFolderPath}`);
            }

            const oauth2Client = new google.auth.OAuth2(
                process.env.GOOGLE_CLIENT_ID,
                process.env.GOOGLE_CLIENT_SECRET,
                process.env.GOOGLE_REDIRECT_URI,
            );
            oauth2Client.setCredentials({ access_token: googleAccessToken });
            const drive = google.drive({ version: 'v3', auth: oauth2Client });

            console.log(`[BackupService][downloadAndUploadBackup] Creando subcarpeta en Google Drive para ${formattedDate}`);
            const folderMetadata = { name: formattedDate, mimeType: 'application/vnd.google-apps.folder', parents: [config.googleFolderId] };
            const folder = await drive.files.create({ requestBody: folderMetadata, fields: 'id', supportsAllDrives: true });
            const driveSubfolderId = folder.data.id!;
            console.log(`[BackupService][downloadAndUploadBackup] Subcarpeta creada en Google Drive, ID: ${driveSubfolderId}`);
            console.log('Subcarpeta Drive ID:', driveSubfolderId);

            let filesProcessed = 0;
            let filesWithErrors = 0;

            for (const [index, url] of allBackupLinks.entries()) {
                console.log(`[BackupService][downloadAndUploadBackup] Procesando archivo ${index + 1}/${allBackupLinks.length}: ${url}`);
                if (Date.now() > expiresAt - 30 * 60 * 1000) {
                    console.log(`[BackupService][downloadAndUploadBackup] Token de Zoho cerca de caducar, renovando...`);
                    const tokenInfo = await this.authService.refreshZohoToken(region);
                    zohoAccessToken = tokenInfo.accessToken;
                    expiresAt = tokenInfo.expiresAt;
                    console.log(`[BackupService][downloadAndUploadBackup] Nuevo token de Zoho obtenido, expira en: ${new Date(expiresAt).toISOString()}`);
                }

                const tempFilePath = path.join(backupFolderPath, `temp_backup_${index + 1}.zip`);
                console.log(`[BackupService][downloadAndUploadBackup] Descargando archivo a: ${tempFilePath}`);
                const response = await axios.get(url, {
                    responseType: 'stream',
                    headers: { Authorization: `Zoho-oauthtoken ${zohoAccessToken}` },
                });

                let fileName = path.basename(tempFilePath);
                const contentDisposition = response.headers['content-disposition'];
                if (contentDisposition) {
                    const matches = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/.exec(contentDisposition);
                    if (matches && matches[1]) fileName = matches[1].replace(/['"]/g, '');
                }
                console.log(`[BackupService][downloadAndUploadBackup] Nombre del archivo: ${fileName}`);

                const finalFilePath = path.join(backupFolderPath, fileName);
                const writer = fs.createWriteStream(finalFilePath);
                response.data.pipe(writer);

                await new Promise((resolve, reject) => {
                    writer.on('finish', () => resolve(undefined));
                    writer.on('error', reject);
                });
                console.log(`[BackupService][downloadAndUploadBackup] Archivo descargado: ${finalFilePath}`);

                const fileMetadata = { name: fileName, parents: [driveSubfolderId] };
                const media = { mimeType: 'application/zip', body: fs.createReadStream(finalFilePath) };
                await drive.files.create({ requestBody: fileMetadata, media, fields: 'id',supportsAllDrives: true });
                console.log(`[BackupService][downloadAndUploadBackup] Archivo subido a Google Drive: ${fileName}`);
                fs.unlinkSync(finalFilePath);
                console.log(`[BackupService][downloadAndUploadBackup] Archivo temporal eliminado: ${finalFilePath}`);
                filesProcessed++;
            }

            if (fs.existsSync(backupFolderPath)) {
                fs.rmSync(backupFolderPath, { recursive: true });
                console.log(`[BackupService][downloadAndUploadBackup] Carpeta local eliminada: ${backupFolderPath}`);
            }

            const message = `Descarga y subida completada para ${region}. Archivos procesados: ${filesProcessed}, errores: ${filesWithErrors}`;
            console.log(`[BackupService][downloadAndUploadBackup] ${message}`);
            await this.emailService.sendBackupStatusEmail(region, true, message);
            return { success: true, message };
        } catch (error) {
            const message = `Error en la descarga y subida para ${region}: ${error.message}`;
            await this.emailService.sendBackupStatusEmail(region, false, message);
            return { success: false, message };
        }
    }

    async downloadAndUploadAllBackups(outputDir: string): Promise<{ success: boolean; results: Record<string, BackupResponseDto> }> {
        const results: Record<string, BackupResponseDto> = {};
        console.log(`[BackupService][downloadAndUploadAllBackups] Iniciando descarga y subida para todas las regiones, outputDir: ${outputDir}`);
        for (const region of Object.keys(this.configService['configs'])) {
            console.log(`[BackupService][downloadAndUploadAllBackups] Procesando región: ${region}`);
            results[region] = await this.downloadAndUploadBackup({ region, outputDir });
            console.log(`[BackupService][downloadAndUploadAllBackups] Resultado para ${region}: ${JSON.stringify(results[region])}`);
        }
        const allSuccessful = Object.values(results).every((result) => result.success);
        console.log(`[BackupService][downloadAndUploadAllBackups] Proceso completado, éxito global: ${allSuccessful}`);
        return { success: allSuccessful, results };
    }
}
