import { getSessionEpoch } from '@/lib/session';
import type { DocumentPickerAsset } from 'expo-document-picker';
import { File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { Platform } from 'react-native';

import { ApiError, getAuthenticatedToken, getApiBaseUrl } from '@/lib/api';
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

export async function uploadProjectFiles(projectId: string, assets: DocumentPickerAsset[], onProgress?: (percent: number) => void) {
  const epoch = getSessionEpoch();
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
  const send = (token: string) => new Promise<ApiSuccess<ProjectFile[]>>((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open('POST', `${getApiBaseUrl()}/projects/${projectId}/files`);
    request.timeout = 120_000;
    request.setRequestHeader('Authorization', `Bearer ${token}`);
    request.setRequestHeader('Accept', 'application/json');
    request.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total) onProgress?.(Math.min(99, Math.round(event.loaded * 100 / event.total)));
    };
    request.onerror = () => reject(new ApiError(0, 'UPLOAD_NETWORK_ERROR', 'Upload gagal. Periksa koneksi dan coba lagi.'));
    request.ontimeout = () => reject(new ApiError(0, 'UPLOAD_TIMEOUT', 'Upload melewati batas waktu. Coba lagi.'));
    request.onabort = () => reject(new ApiError(0, 'UPLOAD_ABORTED', 'Upload dibatalkan'));
    request.onload = () => {
      let body;
      try { body = JSON.parse(request.responseText); }
      catch { reject(new ApiError(request.status, 'INVALID_RESPONSE', 'Respons upload tidak valid')); return; }
      if (request.status < 200 || request.status >= 300) {
        reject(new ApiError(request.status, body?.error?.code ?? 'UPLOAD_FAILED', body?.error?.message ?? 'Upload gagal')); return;
      }
      onProgress?.(100);
      resolve(body);
    };
    request.send(form);
  });
  onProgress?.(0);
  try { return await send(await getAuthenticatedToken()); }
  catch (error) {
    if (getSessionEpoch() !== epoch) throw new ApiError(401, 'SESSION_CHANGED', 'Sesi telah berubah');
    if (!(error instanceof ApiError) || error.status !== 401) throw error;
    onProgress?.(0);
    return send(await getAuthenticatedToken(true));
  }
}

export async function downloadProjectFile(
  file: Pick<ProjectFile, 'id' | 'originalName' | 'mimeType'>,
) {
  const accessToken = await getAuthenticatedToken();
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
