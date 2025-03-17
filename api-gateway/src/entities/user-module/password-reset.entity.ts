export class PasswordReset {
    id: string;

    email: string;

    token: string;

    type: 'email' | 'sms' | 'authenticator';

    created_at: Date;
}
