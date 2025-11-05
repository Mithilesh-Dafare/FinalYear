import jwt, { JwtPayload } from "jsonwebtoken";

const SECRET_KEY = process.env.JWT_SECRET as string;

if (!SECRET_KEY) {
  throw new Error("Missing jwt secret key");
}

type TokenPayload = JwtPayload & { userId: string };

export async function verifyToken(token: string): Promise<TokenPayload> {
  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    if (typeof decoded === 'string' || !decoded || !('userId' in decoded)) {
      throw new Error('Invalid token payload');
    }
    return decoded as TokenPayload;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}

export function getUserIdFromToken(token: string): string {
  try {
    const decoded = jwt.verify(token, SECRET_KEY) as { userId: string };
    return decoded.userId;
  } catch (error) {
    throw new Error("Invalid or expired token");
  }
}
