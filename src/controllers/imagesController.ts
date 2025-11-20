import {Request, Response} from 'express';
import ImageService from "../services/imageService.ts";

class imagesController {
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

        res.json(images.map(img => ({
            id: img.id,
            url: img.url,
            filename: img.filename,
            uploadedAt: img.uploaded_at
        })));
    }

    public static async getImagesPage(req: Request, res: Response): Promise<void> {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;

        const imagesPage = await ImageService.getImagesPage(page, limit);

        res.json(imagesPage.map(img => ({
            id: img.id,
            url: img.url,
            filename: img.filename,
            uploadedAt: img.uploaded_at
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
}

export default imagesController;