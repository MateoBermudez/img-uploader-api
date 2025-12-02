export interface Image {
    id: string;
    userId: string;
    tempUserId?: string;
    url: string;
    filename: string;
    uploadedAt: Date;
}