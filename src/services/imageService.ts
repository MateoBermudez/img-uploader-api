import ImageRepo from "../repositories/imageRepo.ts";
import {AppError} from "../middlewares/handleError.ts";
import {User} from "../types/user.ts";
import AuthRepo from "../repositories/authRepo.ts";
import {Request} from "express";
import config from "../config/env.config.ts";
import TemporalUserRepo from "../repositories/temporalUserRepo.ts";

class imageService {
    public static async getImage(id: string) {
        const image = await ImageRepo.getImage(id);

        if (!image) {
            throw new AppError('Image not found', 404);
        }

        return image;
    }

    public static async uploadImage(file: Express.Multer.File | undefined, req: Request) {
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
                "AccessKey": BUNNY_API_KEY,
                "Content-Type": file.mimetype,
            },
            body: new Uint8Array(file.buffer),
        });

        if (!response.ok) {
            const text = await response.text();
            console.error("Bunny upload error:", text);
            throw new AppError(`Error while uploading to BunnyCDN: ${response.statusText}`, 500);
        }

        const { userId, tempUserId } = (req as any).uploadContext || {};
        if (userId) {
            await ImageRepo.upload({ userId, url: publicUrl, filename: fileName });
            return publicUrl;
        }

        if (tempUserId) {
            await ImageRepo.upload({ tempUserId, url: publicUrl, filename: fileName });
            await TemporalUserRepo.markUploaded(tempUserId);
            return publicUrl;
        }
    }

    public static async uploadVideo(file: Express.Multer.File | undefined, req: Request) {
        if (!file) throw new AppError('No file uploaded', 400);
        if (!file.mimetype.startsWith('video/')) throw new AppError('The uploaded file is not a video', 400);

        const authUser = (req as any).user;
        if (!authUser || !authUser.email) throw new AppError('No authenticated user found', 401);

        const user = await AuthRepo.findUserByEmailOrUsername(authUser.email);
        if (!user) throw new AppError('User not found', 404);

        const libraryId = config.bunny.videoLibraryId;
        const apiKey = config.bunny.apiKeyLibrary;
        if (!libraryId || !apiKey) throw new AppError('BunnyCDN video configuration missing', 500);

        const createResp = await fetch(`https://video.bunnycdn.com/library/${libraryId}/videos`, {
            method: 'POST',
            headers: {
                AccessKey: apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ title: file.originalname })
        });

        if (!createResp.ok) {
            const txt = await createResp.text();
            console.error('Bunny video create error:', createResp.status, txt);
            throw new AppError('Error creating video in BunnyCDN', 500);
        }

        const createJson: any = await createResp.json();
        const videoGuid: string = createJson?.guid;
        if (!videoGuid) throw new AppError('Video GUID not returned by BunnyCDN', 500);

        const uploadUrl = `https://video.bunnycdn.com/library/${libraryId}/videos/${videoGuid}`;
        const putResp = await fetch(uploadUrl, {
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

        await ImageRepo.uploadVideo({
            userId: user.id,
            url: publicUrl,
            filename: file.originalname,
            videoId: videoGuid
        });

        return ({
            url: publicUrl,
            type: 'video',
            videoId: videoGuid
        });
    }

    public static async deleteImage(id: string) {
        const image = await ImageRepo.getImage(id);

        if (!image) {
            throw new AppError('Image not found', 404);
        }

        await ImageRepo.deleteImage(id);
    }

    public static async getAllImagesByUser(user: User, page: number, limit: number) {
        if (!user) {
            throw new AppError('No authenticated user found', 401);
        }

        const userTemp = await AuthRepo.findUserByEmailOrUsername(user.email);
        if (!userTemp) {
            throw new AppError('User not found', 404);
        }
        const id = userTemp.id;

        return await ImageRepo.getImagesByUserId(id, page, limit);
    }

    public static async getImagesPage(page: number, limit: number) {
        return await ImageRepo.getImagesPage(page, limit);
    }

    public static async updateVideoStatusFromCDN(videoId: string, status: number) {

        if (!videoId) {
            throw new AppError('videoId / VideoGuid not provided', 400);
        }

        await ImageRepo.updateVideoStatusFromCDN(videoId, status);
    }

    static async getVideoStatus(videoId: string) {
        if (!videoId) {
            throw new AppError('videoId not provided', 400);
        }

        const video = await ImageRepo.getVideoByVideoUUID(videoId);
        const statusCode = await ImageRepo.getStatusCode(video.status_code)

        if (!video) {
            throw new AppError('Video not found', 404);
        }

        return {
            videoId: videoId,
            status: { code: statusCode.code, name: statusCode.name, description: statusCode.description }
        }
    }

    public static async getAllVideosByUser(user: User, page: number, limit: number) {
        if (!user) {
            throw new AppError('No authenticated user found', 401);
        }

        const userTemp = await AuthRepo.findUserByEmailOrUsername(user.email);

        if (!userTemp) {
            throw new AppError('User not found', 404);
        }

        const id = userTemp.id;

        return await ImageRepo.getVideosByUserId(id, page, limit);
    }

    static async getVideosPage(page: number, limit: number) {
        return await ImageRepo.getVideosPage(page, limit);
    }
}

export default imageService;