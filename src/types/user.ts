export interface User {
    id: number;
    firstName: string;
    lastName: string;
    dateOfBirth: Date;
    email: string;
    username: string;
    passwordHash: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}