import { v4 as uuidv4 } from "uuid";
import pool from "../connection";
import type { User, UserWithPassword } from "@/types/auth";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface UserRow extends RowDataPacket {
  user_uuid: string;
  user_id: string;
  email: string;
  password_hash: string;
  name: string | null;
  created_at: Date;
  updated_at: Date;
}

function mapUser(row: UserRow): User {
  return {
    userUuid: row.user_uuid,
    userId: row.user_id,
    email: row.email,
    name: row.name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapUserWithPassword(row: UserRow): UserWithPassword {
  return {
    ...mapUser(row),
    passwordHash: row.password_hash,
  };
}

export async function findUserByEmail(
  email: string
): Promise<UserWithPassword | null> {
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT * FROM users WHERE email = ?",
    [email]
  );
  if (rows.length === 0) return null;
  return mapUserWithPassword(rows[0]);
}

export async function findUserByUserId(
  userId: string
): Promise<UserWithPassword | null> {
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT * FROM users WHERE user_id = ?",
    [userId]
  );
  if (rows.length === 0) return null;
  return mapUserWithPassword(rows[0]);
}

export async function findUserByUuid(userUuid: string): Promise<User | null> {
  const [rows] = await pool.execute<UserRow[]>(
    "SELECT user_uuid, user_id, email, name, created_at, updated_at FROM users WHERE user_uuid = ?",
    [userUuid]
  );
  if (rows.length === 0) return null;
  return mapUser(rows[0]);
}

export async function createUser(
  userId: string,
  email: string,
  passwordHash: string,
  name?: string
): Promise<User> {
  const userUuid = uuidv4();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO users (user_uuid, user_id, email, password_hash, name) VALUES (?, ?, ?, ?, ?)",
    [userUuid, userId, email, passwordHash, name || null]
  );
  const user = await findUserByUuid(userUuid);
  if (!user) throw new Error("Failed to create user");
  return user;
}

export async function saveRefreshToken(
  userUuid: string,
  tokenHash: string,
  expiresAt: Date
): Promise<void> {
  const refreshTokenUuid = uuidv4();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO refresh_tokens (refresh_token_uuid, user_uuid, token_hash, expires_at) VALUES (?, ?, ?, ?)",
    [refreshTokenUuid, userUuid, tokenHash, expiresAt]
  );
}

export async function deleteAllRefreshTokens(userUuid: string): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "DELETE FROM refresh_tokens WHERE user_uuid = ?",
    [userUuid]
  );
}

export async function cleanupExpiredTokens(): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "DELETE FROM refresh_tokens WHERE expires_at < NOW()"
  );
}
