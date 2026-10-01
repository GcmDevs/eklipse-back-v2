import { KEYS } from '@common/application/constants';
import { SetMetadata } from '@nestjs/common';

export const FileResponse = () => SetMetadata(KEYS.FILE_RESPONSE, true);
