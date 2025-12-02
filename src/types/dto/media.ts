export interface Media {
    id: string;
    videoUuid?: string;
    userId: string;
    url: string;
    filename: string;
    statusCode?: number;
    uploadedAt: Date;
    type?: 'video' | 'image';
    tempUserId?: string;
}