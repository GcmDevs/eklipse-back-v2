import { FileExtensions, MimeTypes } from '@common/domain/enums';

const MimeToExtension: Record<MimeTypes, string> = {
  [MimeTypes.JPEG]: FileExtensions.JPEG,
  [MimeTypes.PNG]: FileExtensions.PNG,
  [MimeTypes.CSV]: FileExtensions.CSV,
  [MimeTypes.PDF]: FileExtensions.PDF,
  [MimeTypes.DOC]: FileExtensions.DOC,
  [MimeTypes.DOCX]: FileExtensions.DOCX,
  [MimeTypes.XLS]: FileExtensions.XLS,
  [MimeTypes.XLSX]: FileExtensions.XLSX,
  [MimeTypes.MP4]: FileExtensions.MP4,
};

export function getExtensionByMime(mime: MimeTypes): string | null {
  return MimeToExtension[mime] ?? null;
}
