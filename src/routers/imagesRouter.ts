import {Router} from "express";
import imagesController from "../controllers/imagesController.ts";
import authenticate from "../middlewares/authenticate.ts";
import guestFingerprint from "../middlewares/guestFingerprint.ts";
import {optionalAuthenticate} from "../middlewares/optionalAuthenticate.ts";
import {resolveUploadOwner} from "../middlewares/resolveUploadOwner.ts";
import {uploadMiddleware} from "../middlewares/uploadMiddleware.ts";

function imagesRouter() {
    const router = Router();

    router.get('/page', imagesController.getImagesPage);
    router.get('/get/:id', authenticate, imagesController.getImage);
    router.get('/', authenticate, imagesController.getAllImagesByUser);
    router.delete('/delete/:id', authenticate, imagesController.deleteImage);

    router.post(
        '/upload',
        guestFingerprint,
        optionalAuthenticate,
        resolveUploadOwner,
        uploadMiddleware,
        imagesController.uploadImage
    );

    router.post(
        '/upload/video',
        authenticate,
        uploadMiddleware,
        imagesController.uploadVideo
    )

    return router;
}

export default imagesRouter;