import pool from "../config/dbConfig";
import AuthRepo from "./authRepo";
import {User} from "../types/dto/user";
import {TemporalUser} from "../types/dto/temporalUser";
import {TemporalUserModel} from "../types/model/temporalUserModel";

class TemporalUserRepo {
    public static async findByFingerprint(fp: string): Promise<TemporalUser | undefined> {
        const { rows } = await pool.query(
            "SELECT * FROM temporal_users WHERE device_fingerprint = $1",
            [fp]
        );

        if (rows.length === 0 || !rows[0] || !rows) {
            return undefined;
        }

        const user: TemporalUserModel = rows[0];
        return {
            userId: user.id,
            deviceFingerprint: user.device_fingerprint,
            hasUploaded: user.has_uploaded,
            createdAt: user.created_at
        } as TemporalUser;
    }

    public static async create(fingerprint: string): Promise<TemporalUser> {
        const { rows } = await pool.query(
            "INSERT INTO temporal_users (device_fingerprint, has_uploaded, created_at) VALUES ($1, FALSE, NOW()) RETURNING *",
            [fingerprint]
        );

        const user: TemporalUserModel = rows[0];

        return {
            userId: user.id,
            deviceFingerprint: user.device_fingerprint,
            hasUploaded: user.has_uploaded,
            createdAt: user.created_at
        } as TemporalUser;
    }

    public static async markUploaded(id: string): Promise<void> {
        await pool.query(
            "UPDATE temporal_users SET has_uploaded = TRUE WHERE id = $1",
            [id]
        );
    }

    public static async linkToUser(fingerprint: string, identifier: string): Promise<void> {
        const user: User | null = await AuthRepo.findUserByEmailOrUsername(identifier);
        if (!user) return;
        const userId = user.id;
        if (!userId) return;
        const temp: TemporalUser | undefined = await this.findByFingerprint(fingerprint);
        if (!temp) return;
        await pool.query(
            "UPDATE images SET user_id = $1, temp_user_id = NULL WHERE temp_user_id = $2 RETURNING id",
            [userId, temp.userId]
        );
        await pool.query("DELETE FROM temporal_users WHERE id = $1", [temp.userId]);
        return;
    }
}

export default TemporalUserRepo;
