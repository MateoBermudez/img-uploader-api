import pool from "../config/dbConfig.ts";
import AuthRepo from "./authRepo.ts";
import {User} from "../types/user.ts";

class TemporalUserRepo {
    public static async findByFingerprint(fp: string) {
        const { rows } = await pool.query(
            "SELECT * FROM temporal_users WHERE device_fingerprint = $1",
            [fp]
        );
        return rows[0];
    }

    public static async create(fingerprint: string) {
        const { rows } = await pool.query(
            "INSERT INTO temporal_users (device_fingerprint, has_uploaded, created_at) VALUES ($1, FALSE, NOW()) RETURNING *",
            [fingerprint]
        );
        return rows[0];
    }

    public static async markUploaded(id: string) {
        await pool.query(
            "UPDATE temporal_users SET has_uploaded = TRUE WHERE id = $1",
            [id]
        );
    }

    public static async linkToUser(fingerprint: string, identifier: string) {
        const user: User | null = await AuthRepo.findUserByEmailOrUsername(identifier);
        if (!user) return 0;
        const userId = user.id;
        if (!userId) return 0;
        const temp = await this.findByFingerprint(fingerprint);
        if (!temp) return 0;
        const { rows } = await pool.query(
            "UPDATE images SET user_id = $1, temp_user_id = NULL WHERE temp_user_id = $2 RETURNING id",
            [userId, temp.id]
        );
        await pool.query("DELETE FROM temporal_users WHERE id = $1", [temp.id]);
        return rows.length;
    }
}

export default TemporalUserRepo;
