export interface ImageModel {
    id: string;
    url: string;
    filename: string;
    uploaded_at: Date;
    user_id?: string;
    temp_user_id?: string;
}