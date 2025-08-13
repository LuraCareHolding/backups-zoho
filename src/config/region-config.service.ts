import { Injectable } from '@nestjs/common';
import { RegionConfig } from './interfaces/region-config.interface';

@Injectable()
export class RegionConfigService {
  private readonly configs: Record<string, RegionConfig> = {
    spain: {
      zohoClientId: process.env.ZOHO_CLIENT_ID || '',
      zohoClientSecret: process.env.ZOHO_CLIENT_SECRET || '',
      zohoRefreshToken: process.env.ZOHO_REFRESH_TOKEN || '',
      zohoDomain: 'zoho.eu',
      zohoURLs: 'eu',
      googleFolderId: process.env.GOOGLE_FOLDER_ID_SPAIN || '',
    },
    uk: {
      zohoClientId: process.env.ZOHO_CLIENT_ID_UK || '',
      zohoClientSecret: process.env.ZOHO_CLIENT_SECRET_UK || '',
      zohoRefreshToken: process.env.ZOHO_REFRESH_TOKEN_UK || '',
      zohoDomain: 'zoho.eu',
      zohoURLs: 'eu',
      googleFolderId: process.env.GOOGLE_FOLDER_ID_UK || '',
    },
    italy: {
      zohoClientId: process.env.ZOHO_CLIENT_ID_ITALY || '',
      zohoClientSecret: process.env.ZOHO_CLIENT_SECRET_ITALY || '',
      zohoRefreshToken: process.env.ZOHO_REFRESH_TOKEN_ITALY || '',
      zohoDomain: 'zoho.eu',
      zohoURLs: 'eu',
      googleFolderId: process.env.GOOGLE_FOLDER_ID_ITALY || '',
    },
  };

  getConfig(region: string): RegionConfig {
    console.log(`[RegionConfigService][getConfig] Obteniendo configuración para región: ${region}`);
    const config = this.configs[region];
    if (!config) {
        console.error(`[RegionConfigService][getConfig] Región no válida: ${region}`);
      throw new Error(`Región no válida: ${region}`);
    }
    console.log(`[RegionConfigService][getConfig] Configuración obtenida: ${JSON.stringify(config)}`);
    return config;
  }
}