import { SignJWT, jwtVerify } from 'jose'
import { config } from '../config/env'

export interface JwtPayload {
  sub: string
  role: string
  iat?: number
  exp?: number
}

export class JwtService {
  private secret: Uint8Array

  constructor() {
    this.secret = new TextEncoder().encode(config.JWT_SECRET)
  }

  async sign(payload: Omit<JwtPayload, 'iat' | 'exp'>): Promise<string> {
    return new SignJWT({ role: payload.role })
      .setProtectedHeader({ alg: 'HS256' })
      .setSubject(payload.sub)
      .setIssuedAt()
      .setExpirationTime(config.JWT_EXPIRES_IN)
      .sign(this.secret)
  }

  async verify(token: string): Promise<JwtPayload> {
    const { payload } = await jwtVerify(token, this.secret)
    return {
      sub: payload.sub as string,
      role: payload['role'] as string,
      iat: payload.iat,
      exp: payload.exp,
    }
  }
}
