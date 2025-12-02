import {Request, Response} from 'express';
import MediaService from "../services/mediaService";
import {Image} from "../types/dto/image";
import {Video} from "../types/dto/video";
import {VideoStatus} from "../types/dto/videoStatus";
import {User} from "../types/dto/user";
import {Media} from "../types/dto/media";

class mediaController {
    public static async getImage(req: Request, res: Response): Promise<void> {
        const id: string | undefined = req.params.id;

        const image: Image = await MediaService.getImage(id);

        res.status(200).send(image);
    }

    public static async deleteImage(req: Request, res: Response): Promise<void> {
        const id: string | undefined = req.params.id;

        await MediaService.deleteImage(id);

        res.status(204).send();
    }

    public static async getAllMediaElementsByUser(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.appUser;

        const page: number = parseInt(req.query.page as string) || 1;
        const limit: number = parseInt(req.query.limit as string) || 10;

        const images: Image[] = await MediaService.getAllImagesByUserPaginated(user, page, limit);

        const videos: Video[] = await MediaService.getAllVideosByUser(user, page, limit);

        const merged: Media[] = MediaService.mergeImagesAndVideos(images, videos);

        res.status(200).send(merged);
    }

    public static async getMediaElementsPaginated(req: Request, res: Response): Promise<void> {
        const page: number = parseInt(req.query.page as string) || 1;
        const limit: number = parseInt(req.query.limit as string) || 10;

        const imagesPage: Image[] = await MediaService.getAllImagesPaginated(page, limit);

        const videosPage: Video[] = await MediaService.getAllVideosPaginated(page, limit);

        const mergedPage: Media[] = MediaService.mergeImagesAndVideos(imagesPage, videosPage);

        res.status(200).send(mergedPage);
    }

    public static async uploadImage(req: Request, res: Response): Promise<void> {
        const file: Express.Multer.File | undefined = req.file;

        const publicUrl: string = await MediaService.uploadImage(file, req);

        res.status(200).json({
            url: publicUrl,
        });
    }

    public static async uploadVideo(req: Request, res: Response): Promise<void> {
        const file: Express.Multer.File | undefined = req.file;
        const videoData: Video = await MediaService.uploadVideo(file, req);

        res.status(200).json(videoData);
    }

    public static async updateVideoStatusFromCDN(req: Request, res: Response): Promise<void> {
        const videoId: string = req.body?.VideoGuid;
        const statusCode: number = req.body?.Status;

        await MediaService.updateVideoStatusFromCDN(videoId, statusCode);

        res.sendStatus(200);
    }

    public static async getVideoStatus(req: Request, res: Response): Promise<void> {
        const videoId: string | undefined = req.params.videoId;

        const status: VideoStatus = await MediaService.getVideoStatus(videoId);

        res.status(200).json({ videoId, status });
    }
}

export default mediaController;