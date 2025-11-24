import {Request, Response} from 'express';
import ImageService from "../services/imageService.ts";

class mediaController {
    public static async getImage(req: Request, res: Response): Promise<void> {
        const id = req.params.id;

        const image = await ImageService.getImage(id);

        res.json({
            id: image.id,
            url: image.url,
            filename: image.filename,
            uploadedAt: image.uploaded_at
        });
    }

    public static async deleteImage(req: Request, res: Response): Promise<void> {
        const id = req.params.id;

        await ImageService.deleteImage(id);

        res.status(204).send();
    }

    public static async getAllImagesByUser(req: Request, res: Response) {
        const user = (req as any).user;

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const images = await ImageService.getAllImagesByUser(user, page, limit);

        const videos = await ImageService.getAllVideosByUser(user, page, limit);

        const merged = mediaController.mergeImagesAndVideos(images, videos);

        res.json(merged.map(item => ({
            id: item.id,
            url: item.url,
            filename: item.filename,
            uploadedAt: item.uploaded_at
        })));
    }

    private static mergeImagesAndVideos(images: any[], videos: any[]) {
        const merged = [...images, ...videos];
        merged.sort((a, b) => new Date(b.uploaded_at).getTime() - new Date(a.uploaded_at).getTime());
        return merged;
    }

    public static async getImagesPage(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const imagesPage = await ImageService.getImagesPage(page, limit);

        const videosPage = await ImageService.getVideosPage(page, limit);

        const mergedPage = mediaController.mergeImagesAndVideos(imagesPage, videosPage);

        res.json(mergedPage.map(item => ({
            id: item.id,
            url: item.url,
            filename: item.filename,
            uploadedAt: item.uploaded_at
        })));
    }

    public static async uploadImage(req: Request, res: Response) {
        const file = req.file;

        const publicUrl = await ImageService.uploadImage(file, req);

        return res.json({
            url: publicUrl,
        });
    }

    public static async uploadVideo(req: Request, res: Response) {
        const file = req.file;
        const videoData = await ImageService.uploadVideo(file, req);

        return res.json(videoData);
    }

    public static async updateVideoStatusFromCDN(req: Request, res: Response) {
        const videoId = req.body && (req.body.VideoGuid);
        const status = req.body && (req.body.Status);

        await ImageService.updateVideoStatusFromCDN(videoId, status);

        return res.sendStatus(200);
    }

    public static async getVideoStatus(req: Request, res: Response) {
        const videoId = req.params.videoId;

        const status = await ImageService.getVideoStatus(videoId);

        return res.json({ videoId, status });
    }
}

export default mediaController;