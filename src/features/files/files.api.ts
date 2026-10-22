import type { DocumentPickerAsset } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { ApiError, authenticatedRequest, getApiBaseUrl } from '@/lib/api';
import { getAccessToken } from '@/lib/session';
import type { ApiSuccess } from '@/types/api';

import type { ProjectFile } from './files.types';

const allowedMimeTypes = new Set(['application/pdf', 'image/jpeg', 'image/png']);
const maxFileSize = 10 * 1024 * 1024;

export function validatePickedFiles(assets: DocumentPickerAsset[]) {
  if (assets.length === 0) throw new ApiError(422, 'FILE_REQUIRED', 'Pilih minimal satu file');
  if (assets.length > 5) throw new ApiError(422, 'TOO_MANY_FILES', 'Maksimal 5 file per upload');
  for (const asset of assets) {
    if (!asset.mimeType || !allowedMimeTypes.has(asset.mimeType)) {
      throw new ApiError(422, 'INVALID_FILE_TYPE', 'File harus berupa PDF, JPEG, atau PNG');
    }
    if (asset.size && asset.size > maxFileSize) {
      throw new ApiError(413, 'FILE_TOO_LARGE', `${asset.name} melebihi batas 10 MiB`);
    }
  }
}

export function uploadProjectFiles(projectId: string, assets: DocumentPickerAsset[]) {
  validatePickedFiles(assets);
  const form = new FormData();
  for (const asset of assets) {
    if (Platform.OS === 'web' && asset.file) {
      form.append('files', asset.file, asset.name);
    } else {
      form.append('files', {
        uri: asset.uri,
        name: asset.name,
        type: asset.mimeType,
      } as unknown as Blob);
    }
  }
  return authenticatedRequest<ApiSuccess<ProjectFile[]>>(`/projects/${projectId}/files`, {
    method: 'POST',
    body: form,
  });
}

export async function downloadProjectFile(
  file: Pick<ProjectFile, 'id' | 'originalName' | 'mimeType'>,
) {
  const accessToken = getAccessToken();
  if (!accessToken) throw new ApiError(401, 'UNAUTHENTICATED', 'Silakan masuk kembali');
  if (Platform.OS === 'web') {
    throw new ApiError(400, 'DOWNLOAD_UNAVAILABLE', 'Download berautentikasi tersedia di aplikasi perangkat');
  }
  const safeName = file.originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const destination = new File(Paths.cache, `${file.id}-${safeName}`);
  const downloaded = await File.downloadFileAsync(
    `${getApiBaseUrl()}/files/${file.id}/download`,
    destination,
    { headers: { Authorization: `Bearer ${accessToken}` }, idempotent: true },
  );
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(downloaded.uri, { mimeType: file.mimeType, dialogTitle: file.originalName });
  } else if (await File.canPreview(downloaded)) {
    await File.preview(downloaded, { title: file.originalName, mimeType: file.mimeType });
  }
  return downloaded.uri;
}
