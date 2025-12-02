import {Request, Response} from 'express';
import ImageService from "../services/mediaService";
import {Image} from "../types/dto/image";
import {Video} from "../types/dto/video";
import {VideoStatus} from "../types/dto/videoStatus";
import {User} from "../types/dto/user";
import {Media} from "../types/dto/media";

class mediaController {
    public static async getImage(req: Request, res: Response): Promise<void> {
        const id: string | undefined = req.params.id;

        const image: Image = await ImageService.getImage(id);

        res.status(200).send(image);
    }

    public static async deleteImage(req: Request, res: Response): Promise<void> {
        const id: string | undefined = req.params.id;

        await ImageService.deleteImage(id);

        res.status(204).send();
    }

    public static async getAllMediaElementsByUser(req: Request, res: Response): Promise<void> {
        const user: User | undefined = req.appUser;

        const page: number = parseInt(req.query.page as string) || 1;
        const limit: number = parseInt(req.query.limit as string) || 10;

        const images: Image[] = await ImageService.getAllImagesByUserPaginated(user, page, limit);

        const videos: Video[] = await ImageService.getAllVideosByUser(user, page, limit);

        const merged: Media[] = mediaController.mergeImagesAndVideos(images, videos);

        res.status(200).send(merged);
    }

    private static mergeImagesAndVideos(images: Image[], videos: Video[]): Media[] {
        const merged: Image[] = [...images, ...videos];
        merged.sort((a: Image, b: Image): number => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        return merged;
    }

    public static async getMediaElementsPaginated(req: Request, res: Response): Promise<void> {
        const page: number = parseInt(req.query.page as string) || 1;
        const limit: number = parseInt(req.query.limit as string) || 10;

        const imagesPage: Image[] = await ImageService.getAllImagesPaginated(page, limit);

        const videosPage: Video[] = await ImageService.getAllVideosPaginated(page, limit);

        const mergedPage: Media[] = mediaController.mergeImagesAndVideos(imagesPage, videosPage);

        res.status(200).send(mergedPage);
    }

    public static async uploadImage(req: Request, res: Response): Promise<void> {
        const file: Express.Multer.File | undefined = req.file;

        const publicUrl: string = await ImageService.uploadImage(file, req);

        res.status(200).json({
            url: publicUrl,
        });
    }

    public static async uploadVideo(req: Request, res: Response): Promise<void> {
        const file: Express.Multer.File | undefined = req.file;
        const videoData: Video = await ImageService.uploadVideo(file, req);

        res.status(200).json(videoData);
    }

    public static async updateVideoStatusFromCDN(req: Request, res: Response): Promise<void> {
        const videoId: string = req.body?.VideoGuid;
        const statusCode: number = req.body?.Status;

        await ImageService.updateVideoStatusFromCDN(videoId, statusCode);

        res.sendStatus(200);
    }

    public static async getVideoStatus(req: Request, res: Response): Promise<void> {
        const videoId: string | undefined = req.params.videoId;

        const status: VideoStatus = await ImageService.getVideoStatus(videoId);

        res.status(200).json({ videoId, status });
    }
}

export default mediaController;