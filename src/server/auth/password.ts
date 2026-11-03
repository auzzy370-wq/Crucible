import bcrypt from "bcryptjs";

/** Cost 8 keeps serverless login under Vercel timeouts (bcryptjs is pure JS). */
const ROUNDS = 8;

export async function hashPassword(password: string) {
  return bcrypt.hash(password, ROUNDS);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}
