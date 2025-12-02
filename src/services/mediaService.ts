import MediaRepo from "../repositories/mediaRepo";
import {AppError} from "../middlewares/handleError";
import {User} from "../types/dto/user";
import AuthRepo from "../repositories/authRepo";
import {Request} from "express";
import config from "../config/env.config";
import TemporalUserRepo from "../repositories/temporalUserRepo";
import {Image} from "../types/dto/image";
import {Video} from "../types/dto/video";
import {VideoStatus} from "../types/dto/videoStatus";
import {BunnyResponseJson} from "../types/dto/bunnyResponseJson";

class mediaService {
    public static async getImage(id: string | undefined): Promise<Image> {
        if (!id) {
            throw new AppError('Image ID not provided', 400);
        }

        const image: Image | null = await MediaRepo.getImage(id);

        if (!image) {
            throw new AppError('Image not found', 404);
        }

        return image;
    }

    public static async uploadImage(file: Express.Multer.File | undefined, req: Request): Promise<string> {
        if (!file) {
            throw new AppError("No file uploaded", 400);
        }

        const BUNNY_STORAGE_ZONE = config.bunny.storageZone;
        const BUNNY_API_KEY = config.bunny.apiKeyStorage;
        const BUNNY_REGION = config.bunny.region;

        if (!BUNNY_STORAGE_ZONE || !BUNNY_API_KEY || !BUNNY_REGION) {
            throw new AppError("Missing BunnyCDN configuration", 500);
        }

        const auxiliaryName = file.originalname.replace(/\s+/g, '_');

        const fileName = `${Date.now()}-${auxiliaryName}`;
        const uploadUrl = `https://${BUNNY_REGION}.storage.bunnycdn.com/${BUNNY_STORAGE_ZONE}/${fileName}`;
        const publicUrl = `https://${BUNNY_STORAGE_ZONE}.b-cdn.net/${fileName}`;

        const response = await fetch(uploadUrl, {
            method: "PUT",
            headers: {
                AccessKey: BUNNY_API_KEY,
                "Content-Type": file.mimetype,
            },
            body: new Uint8Array(file.buffer),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Bunny upload error:", text);
            throw new AppError(`Error while uploading to BunnyCDN: ${response.statusText}`, 500);
        }

        const { userId, tempUserId } = req.uploadContext || {};
        if (userId) {
            await MediaRepo.uploadImage({ userId, url: publicUrl, filename: fileName });
            return publicUrl;
        }

        if (tempUserId) {
            await MediaRepo.uploadImage({ tempUserId, url: publicUrl, filename: fileName });
            await TemporalUserRepo.markUploaded(tempUserId);
            return publicUrl;
        }

        throw new AppError("No user context found for upload", 401);
    }

    public static async uploadVideo(file: Express.Multer.File | undefined, req: Request): Promise<Video> {
        if (!file) throw new AppError('No file uploaded', 400);
        if (!file.mimetype.startsWith('video/')) throw new AppError('The uploaded file is not a video', 400);

        const authUser: User | undefined = req.appUser;
        if (!authUser || !authUser.email) throw new AppError('No authenticated user found', 401);

        const user: User | null = await AuthRepo.findUserByEmailOrUsername(authUser.email);
        if (!user) throw new AppError('User not found', 404);

        const libraryId = config.bunny.videoLibraryId;
        const apiKey = config.bunny.apiKeyLibrary;
        if (!libraryId || !apiKey) throw new AppError('BunnyCDN video configuration missing', 500);

        const createResp: Response = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
            method: 'POST',
            headers: {
                AccessKey: apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: file.originalname })
        });

        if (!createResp.ok) {
            const txt: string = await createResp.text();
            console.error('Bunny video create error:', createResp.status, txt);
            throw new AppError('Error creating video in BunnyCDN', 500);
        }

        const createJson: BunnyResponseJson = await createResp.json();
        const videoGuid: string = createJson?.guid;
        if (!videoGuid) throw new AppError('Video GUID not returned by BunnyCDN', 500);

        const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`;
        const putResp: Response = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
                AccessKey: apiKey,
                'Content-Type': file.mimetype
            },
            body: new Uint8Array(file.buffer)
        });

        if (!putResp.ok) {
            const txt = await putResp.text();
            console.error('Bunny video upload error:', putResp.status, txt);
            throw new AppError('Error uploading video to BunnyCDN', 500);
        }

        const publicUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${videoGuid}`;

        await MediaRepo.uploadVideo({
            userId: user.id,
            url: publicUrl,
            filename: file.originalname,
            videoId: videoGuid
        });

        return ({
            url: publicUrl,
            type: 'video',
            videoUuid: videoGuid
        } as Video);
    }

    public static async deleteImage(id: string | undefined): Promise<void> {
        if (!id) {
            throw new AppError('Image ID not provided', 400);
        }

        const image: Image | null = await MediaRepo.getImage(id);

        if (!image) {
            throw new AppError('Image not found', 404);
        }

        await MediaRepo.deleteImage(id);
    }

    public static async getAllImagesByUserPaginated(user: User | undefined, page: number, limit: number): Promise<Image[]> {
        if (!user) {
            throw new AppError('No authenticated user found', 401);
        }

        const userTemp: User | null = await AuthRepo.findUserByEmailOrUsername(user.email);
        if (!userTemp) {
            throw new AppError('User not found', 404);
        }
        const id: string = userTemp.id;

        return await MediaRepo.getImagesByUserId(id, page, limit);
    }

    public static async getAllImagesPaginated(page: number, limit: number): Promise<Image[]> {
        return await MediaRepo.getImagesPaginated(page, limit);
    }

    public static async updateVideoStatusFromCDN(videoId: string, statusCode: number): Promise<void> {

        if (!videoId) {
            throw new AppError('videoId / VideoGuid not provided', 400);
        }

        await MediaRepo.updateVideoStatusFromCDN(videoId, statusCode);
    }

    static async getVideoStatus(videoId: string | undefined): Promise<VideoStatus> {
        if (!videoId) {
            throw new AppError('videoId not provided', 400);
        }

        const video: Video | null = await MediaRepo.getVideoByVideoUUID(videoId);

        if (!video) {
            throw new AppError('Video not found', 404);
        }

        return await MediaRepo.getStatusCode(video.statusCode)
    }

    public static async getAllVideosByUser(user: User | undefined, page: number, limit: number): Promise<Video[]> {
        if (!user) {
            throw new AppError('No authenticated user found', 401);
        }

        const userTemp: User | null = await AuthRepo.findUserByEmailOrUsername(user.email);

        if (!userTemp) {
            throw new AppError('User not found', 404);
        }

        const id: string = userTemp.id;

        return await MediaRepo.getVideosByUserId(id, page, limit);
    }

    static async getAllVideosPaginated(page: number, limit: number): Promise<Video[]> {
        return await MediaRepo.getVideosPaginated(page, limit);
    }
}

export default mediaService;