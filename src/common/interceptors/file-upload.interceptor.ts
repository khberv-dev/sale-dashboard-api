import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export const fileUploadInterceptor = (entryName: string) => {
  return FileInterceptor('file', {
    storage: diskStorage({
      destination: path.join('uploads', entryName),
      filename: (req, file, callback) => {
        const ext = path.extname(file.originalname);
        const id = randomUUID();
        const fileName = id + ext;

        callback(null, fileName);
      },
    }),
  });
};
