import {Profile as GitHubProfile} from "passport-github2";

export interface GithubEmail {
    email: string;
    primary: boolean;
    verified: boolean;
    visibility: string | null;
}

export interface GitHubProfileWithEmails extends GitHubProfile {
    emails?: Array<{ value: string; primary?: boolean; verified?: boolean }>;
}