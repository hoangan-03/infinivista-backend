export class TokenDataDto {
    access_token: string;

    // expires_in: number;
    // no need

    refresh_token: string;
}

export class AuthTokenResponseDto {
    data: TokenDataDto;
}
