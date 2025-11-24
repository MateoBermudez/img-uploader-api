import {Router} from "express";
import mediaController from "../controllers/mediaController.ts";
import authenticate from "../middlewares/authenticate.ts";
import guestFingerprint from "../middlewares/guestFingerprint.ts";
import {optionalAuthenticate} from "../middlewares/optionalAuthenticate.ts";
import {resolveUploadOwner} from "../middlewares/resolveUploadOwner.ts";
import {uploadMiddleware} from "../middlewares/uploadMiddleware.ts";

function imagesRouter() {
    const router = Router();

    router.get('/page', mediaController.getImagesPage);
    router.get('/get/:id', authenticate, mediaController.getImage);
    router.get('/', authenticate, mediaController.getAllImagesByUser);
    router.delete('/delete/:id', authenticate, mediaController.deleteImage);

    router.post(
        '/upload',
        guestFingerprint,
        optionalAuthenticate,
        resolveUploadOwner,
        uploadMiddleware,
        mediaController.uploadImage
    );

    router.post(
        '/upload/video',
        authenticate,
        uploadMiddleware,
        mediaController.uploadVideo
    );

    router.post('/video/update-status', mediaController.updateVideoStatusFromCDN);

    router.get('/video/get-status/:videoId', authenticate, mediaController.getVideoStatus);

    return router;
}

export default imagesRouter;