export interface VideoModel {
    id: string;
    url: string;
    filename: string;
    uploaded_at: Date;
    user_id: string;
    video_uuid: string;
    status_code: number;
}