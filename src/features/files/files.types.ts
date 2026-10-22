export type ProjectFileStatus = 'READY' | 'FAILED';

export type ProjectFile = {
  id: string;
  projectId: string;
  uploaderId: string;
  originalName: string;
  mimeType: string;
  size: number;
  checksum: string;
  status: ProjectFileStatus;
  createdAt: string;
};
