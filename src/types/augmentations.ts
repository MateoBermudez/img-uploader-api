import {TemporalUser} from "./dto/temporalUser";
import {UploadContext} from "./dto/uploadContext";
import {User} from "./dto/user";

declare module 'express-serve-static-core' {
    interface Request {
        guest_fp?: string;
        uploadContext?: UploadContext;
        tempRecord?: TemporalUser;
        appUser?: User;
    }
}

export {};