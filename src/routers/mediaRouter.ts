import {Router} from "express";
import mediaController from "../controllers/mediaController";
import authenticate from "../middlewares/authenticate";
import guestFingerprint from "../middlewares/guestFingerprint";
import {optionalAuthenticate} from "../middlewares/optionalAuthenticate";
import {resolveUploadOwner} from "../middlewares/resolveUploadOwner";
import {uploadMiddleware} from "../middlewares/uploadMiddleware";

function mediaRouter() {
    const router = Router();

    router.get('/all/page', mediaController.getMediaElementsPaginated);
    router.get('/image/get/:id', authenticate, mediaController.getImage);
    router.get('/user/all', authenticate, mediaController.getAllMediaElementsByUser);
    router.delete('/delete/:id', authenticate, mediaController.deleteImage);

    router.post(
        '/upload/image',
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

export default mediaRouter;