export interface User {
  userUuid: string;
  userId: string;
  email: string;
  name: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserWithPassword extends User {
  passwordHash: string;
}

export interface RefreshToken {
  refreshTokenUuid: string;
  userUuid: string;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

export interface JWTPayload {
  userUuid: string;
  iat: number;
  exp: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  userId: string;
  password: string;
}

export interface RegisterRequest {
  userId: string;
  email: string;
  password: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}
