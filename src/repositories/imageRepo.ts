import pool from "../config/dbConfig.ts";

class ImageRepo {
    public static async getImage(id: string) {
        const { rows } = await pool.query(
            "SELECT id, url, filename, uploaded_at FROM images WHERE id = $1",
            [id]
        );
        return rows[0];
    }

    public static async upload(opts: { userId?: number, tempUserId?: string, url: string, filename: string }) {
        const { userId, tempUserId, url, filename } = opts;
        const query = userId
            ? "INSERT INTO images (user_id, url, filename, uploaded_at) VALUES ($1, $2, $3, NOW()) RETURNING *"
            : "INSERT INTO images (temp_user_id, url, filename, uploaded_at) VALUES ($1, $2, $3, NOW()) RETURNING *";
        const param = userId ?? tempUserId;
        const { rows } = await pool.query(query, [param, url, filename]);
        return rows[0];
    }


    public static async deleteImage(id: string): Promise<void> {
        await pool.query(
            "DELETE FROM images WHERE id = $1 RETURNING *",
            [id]
        );
    }

    public static async getImagesPage(page: number, limit: number) {
        const { rows } = await pool.query(
            "SELECT id, url, filename, uploaded_at FROM images ORDER BY uploaded_at DESC LIMIT $1 OFFSET $2",
            [limit, (page - 1) * limit]
        );
        return rows;
    }

    public static async getImagesByUserId(userId: number, page: number, limit: number) {
        const { rows } = await pool.query(
            "SELECT id, url, filename, uploaded_at FROM images WHERE user_id = $1 ORDER BY uploaded_at DESC LIMIT $2 OFFSET $3",
            [userId, limit, (page - 1) * limit]
        );
        return rows;
    }
}

export default ImageRepo;