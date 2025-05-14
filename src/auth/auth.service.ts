import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { RegionConfigService } from '../config/region-config.service';

@Injectable()
export class AuthService {
  constructor(private readonly configService: RegionConfigService) {}

  async refreshZohoToken(region: string): Promise<{ accessToken: string; expiresAt: number }> {
    console.log(`[AuthService][refreshZohoToken] Solicitando token de Zoho para región: ${region}`);
    const config = this.configService.getConfig(region);
    const url = `https://accounts.${config.zohoDomain}/oauth/v2/token`;
    console.log(`[AuthService][refreshZohoToken] Enviando POST a: ${url}`);
    const params = new URLSearchParams({
      refresh_token: config.zohoRefreshToken,
      client_id: config.zohoClientId,
      client_secret: config.zohoClientSecret,
      grant_type: 'refresh_token',
    });

    const response = await axios.post(url, params);
    return {
      accessToken: response.data.access_token,
      expiresAt: Date.now() + response.data.expires_in * 1000,
    };
  }

  async refreshGoogleToken(): Promise<string> {
    console.log(`[AuthService][refreshGoogleToken] Solicitando token de Google`);
    const url = 'https://oauth2.googleapis.com/token';
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID || '',
      client_secret: process.env.GOOGLE_CLIENT_SECRET || '',
      refresh_token: process.env.GOOGLE_REFRESH_TOKEN || '',
      grant_type: 'refresh_token',
    });
    console.log(`[AuthService][refreshGoogleToken] Enviando POST a: ${url}`);
    const response = await axios.post(url, params);
    console.log(`[AuthService][refreshGoogleToken] Respuesta de Google: ${JSON.stringify(response.data)}`);
    return response.data.access_token;
  }
}