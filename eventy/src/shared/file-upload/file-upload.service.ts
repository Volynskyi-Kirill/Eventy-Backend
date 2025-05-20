import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  UPLOADS_DIR,
  TEMP_UPLOADS_DIR,
  TEMP_UPLOADS_URL_PREFIX,
  FILE_CLEANUP,
} from 'src/events/helpers/constants';

@Injectable()
export class FileUploadService {
  async uploadTempFile(file: any) {
    const isTempDirExists = fs.existsSync(TEMP_UPLOADS_DIR);
    if (!isTempDirExists) {
      fs.mkdirSync(TEMP_UPLOADS_DIR, { recursive: true });
    }

    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    const filePath = path.join(TEMP_UPLOADS_DIR, uniqueFilename);

    fs.writeFileSync(filePath, file.buffer);

    return {
      filePath: `${TEMP_UPLOADS_URL_PREFIX}/${uniqueFilename}`,
      filename: uniqueFilename,
    };
  }

  ensureDirectoryExists(dirPath: string) {
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  moveFile(tempFilePath: string, destinationFilePath: string) {
    if (fs.existsSync(tempFilePath)) {
      fs.copyFileSync(tempFilePath, destinationFilePath);
      this.removeFile(tempFilePath);
      return true;
    }
    return false;
  }

  removeFile(filePath: string) {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  cleanupTempDirectory() {
    if (!fs.existsSync(TEMP_UPLOADS_DIR)) return;

    const files = fs.readdirSync(TEMP_UPLOADS_DIR);
    const now = Date.now();

    const TIME_TO_DELETE_FILE = FILE_CLEANUP.TEN_SECONDS;

    for (const file of files) {
      const filePath = path.join(TEMP_UPLOADS_DIR, file);
      const stats = fs.statSync(filePath);

      const isOld = now - stats.mtimeMs > TIME_TO_DELETE_FILE;
      if (isOld) {
        fs.unlinkSync(filePath);
      }
    }
  }
}
