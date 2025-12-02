import multer, {Multer} from "multer";

const upload: Multer = multer({ storage: multer.memoryStorage() });

export const uploadMiddleware = upload.single("file");