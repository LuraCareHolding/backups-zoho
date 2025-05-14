export class BackupRequestDto {
    region: string;
    outputDir?: string;
    urls?: {
      data_links?: string[];
      attachment_links?: string[];
    };
  }