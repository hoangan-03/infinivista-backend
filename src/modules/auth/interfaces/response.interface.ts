export interface AuthResponse {
    data: {
      access_token: string;
      expires_in: number;
      refresh_token: string;
    };
  }