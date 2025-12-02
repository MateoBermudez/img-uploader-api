import pool from "../config/dbConfig";
import {Image} from "../types/dto/image";
import {Video} from "../types/dto/video";
import {VideoStatus} from "../types/dto/videoStatus";
import {ImageModel} from "../types/model/imageModel";
import {VideoModel} from "../types/model/videoModel";
import {VideoStatusModel} from "../types/model/videoStatusModel";
import {AppError} from "../middlewares/handleError";


class MediaRepo {
    public static async getImage(id: string): Promise<Image | null> {
        const { rows } = await pool.query<ImageModel>(
            "SELECT id, url, filename, uploaded_at, user_id FROM images WHERE id = $1",
            [id]
        );

        if (rows.length === 0 || !rows[0]) {
            return null;
        }

        return this.mapRowToImage(rows[0]);
    }

    public static async uploadImage(opts: { userId?: string, tempUserId?: string, url: string, filename: string }): Promise<Image> {
        const { userId, tempUserId, url, filename } = opts;
        const query = userId
            ? "INSERT INTO images (user_id, url, filename, uploaded_at) VALUES ($1, $2, $3, NOW()) RETURNING *"
            : "INSERT INTO images (temp_user_id, url, filename, uploaded_at) VALUES ($1, $2, $3, NOW()) RETURNING *";
        const param = userId ?? tempUserId;
        const { rows } = await pool.query<ImageModel>(query, [param, url, filename]);

        if (rows.length === 0 || !rows[0]) {
            throw new AppError('Failed to upload image', 500);
        }

        return this.mapRowToImage(rows[0]);
    }


    public static async deleteImage(id: string): Promise<void> {
        await pool.query(
            "DELETE FROM images WHERE id = $1 RETURNING *",
            [id]
        );
    }

    public static async getImagesPaginated(page: number, limit: number): Promise<Image[]> {
        const { rows } = await pool.query<ImageModel>(
            "SELECT id, url, filename, uploaded_at, user_id FROM images ORDER BY uploaded_at DESC LIMIT $1 OFFSET $2",
            [limit, (page - 1) * limit]
        );

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => this.mapRowToImage(row));
    }

    public static async getImagesByUserId(userId: string, page: number, limit: number): Promise<Image[]> {
        const { rows } = await pool.query<ImageModel>(
            "SELECT id, url, filename, uploaded_at, user_id FROM images WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT $2 OFFSET $3",
            [userId, limit, (page - 1) * limit]
        );

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => this.mapRowToImage(row));
    }

    public static async uploadVideo(params: {userId: string; url: string; filename: string, videoId: string}): Promise<Video> {
        const { userId, url, filename, videoId } = params;
        const query: string = "INSERT INTO videos (user_id, url, filename, uploaded_at, video_uuid) VALUES ($1, $2, $3, NOW(), $4) RETURNING *";
        const { rows } = await pool.query<VideoModel>(query, [userId, url, filename, videoId]);

        if (rows.length === 0 || !rows[0]) {
            throw new AppError('Failed to upload video', 500);
        }

        return this.mapRowToVideo(rows[0]);
    }

    public static async updateVideoStatusFromCDN(videoId: string, status: number): Promise<Video> {
        const { rows } = await pool.query<VideoModel>(
            "UPDATE videos SET status_code = $1 WHERE video_uuid = $2 RETURNING *",
            [status, videoId]
        );

        if (rows.length === 0 || !rows[0]) {
            throw new AppError('Video not found', 404);
        }

        return this.mapRowToVideo(rows[0]);
    }

    public static async getVideoByVideoUUID(videoId: string): Promise<Video | null> {
        const { rows } = await pool.query<VideoModel>(
            "SELECT id, url, filename, uploaded_at, status_code, user_id, video_uuid FROM videos WHERE video_uuid = $1",
            [videoId]
        );

        if (!rows[0]) {
            return null;
        }

        return this.mapRowToVideo(rows[0]);
    }

    public static async getStatusCode(status_code: number): Promise<VideoStatus> {
        const { rows } = await pool.query<VideoStatusModel>(
            "SELECT code, name, description FROM video_statuses WHERE code = $1",
            [status_code]
        );

        if (!rows[0]) {
            throw new Error('Status code not found');
        }

        return this.mapRowToVideoStatus(rows[0]);
    }

    public static async getVideosByUserId(id: string, page: number, limit: number): Promise<Video[]> {
        const { rows } = await pool.query<VideoModel>(
            "SELECT id, url, filename, uploaded_at, status_code, video_uuid, user_id FROM videos WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT $2 OFFSET $3",
            [id, limit, (page - 1) * limit]
        );

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => this.mapRowToVideo(row));
    }

    public static async getVideosPaginated(page: number, limit: number): Promise<Video[]> {
        const { rows } = await pool.query<VideoModel>(
            "SELECT id, url, filename, uploaded_at, status_code, video_uuid, user_id FROM videos ORDER BY uploaded_at DESC LIMIT $1 OFFSET $2",
            [limit, (page - 1) * limit]
        );

        if (rows.length === 0) {
            return [];
        }

        return rows.map(row => this.mapRowToVideo(row));
    }

    private static mapRowToImage(row: ImageModel): Image {
        return {
            id: row.id,
            url: row.url,
            filename: row.filename,
            uploadedAt: row.uploaded_at,
            userId: row.user_id || '',
            tempUserId: row.temp_user_id || ''
        };
    }

    private static mapRowToVideo(row: VideoModel): Video {
        return {
            id: row.id,
            url: row.url,
            filename: row.filename,
            uploadedAt: row.uploaded_at,
            userId: row.user_id,
            videoUuid: row.video_uuid,
            statusCode: row.status_code
        };
    }

    private static mapRowToVideoStatus(row: VideoStatusModel): VideoStatus {
        return {
            code: row.code,
            name: row.name,
            description: row.description
        };
    }
}

export default MediaRepo;