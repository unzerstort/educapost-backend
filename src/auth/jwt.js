import jwt from "jsonwebtoken";

const SECRET = process.env.JWT_SECRET || "dev-secret-change-in-production";
const EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

/**
 * Gera um token JWT com role e id do usuário.
 * @param {{ role: 'teacher' | 'student', id: number }} payload
 * @returns {string}
 */
export function signToken(payload) {
  return jwt.sign(payload, SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * Valida o token e retorna o payload (role, id) ou null.
 * @param {string} token
 * @returns {{ role: 'teacher' | 'student', id: number } | null}
 */
export function verifyToken(token) {
  try {
    const decoded = jwt.verify(token, SECRET);
    if (
      decoded &&
      (decoded.role === "teacher" || decoded.role === "student") &&
      typeof decoded.id === "number"
    ) {
      return { role: decoded.role, id: decoded.id };
    }
    return null;
  } catch {
    return null;
  }
}
