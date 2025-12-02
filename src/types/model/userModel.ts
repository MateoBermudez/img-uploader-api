export interface UserModel {
    id: string;
    first_name: string;
    last_name: string;
    date_of_birth: Date;
    email: string;
    username: string;
    password_hash: string;
    is_active: boolean;
    created_at: Date;
    updated_at: Date;
}