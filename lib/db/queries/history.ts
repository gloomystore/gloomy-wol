import { v4 as uuidv4 } from "uuid";
import pool from "../connection";
import type { WolHistory } from "@/types/device";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface HistoryRow extends RowDataPacket {
  history_uuid: string;
  device_uuid: string;
  user_uuid: string;
  result: "success" | "failure";
  error_message: string | null;
  device_responded_at: Date | null;
  created_at: Date;
  device_name?: string;
  mac_address?: string;
}

function mapHistory(row: HistoryRow): WolHistory {
  return {
    historyUuid: row.history_uuid,
    deviceUuid: row.device_uuid,
    userUuid: row.user_uuid,
    result: row.result,
    errorMessage: row.error_message,
    deviceRespondedAt: row.device_responded_at,
    createdAt: row.created_at,
    deviceName: row.device_name,
    macAddress: row.mac_address,
  };
}

export async function createWolHistory(
  deviceUuid: string,
  userUuid: string,
  result: "success" | "failure",
  errorMessage?: string
): Promise<WolHistory> {
  const historyUuid = uuidv4();
  await pool.execute<ResultSetHeader>(
    "INSERT INTO wol_history (history_uuid, device_uuid, user_uuid, result, error_message) VALUES (?, ?, ?, ?, ?)",
    [historyUuid, deviceUuid, userUuid, result, errorMessage || null]
  );

  const [rows] = await pool.execute<HistoryRow[]>(
    "SELECT * FROM wol_history WHERE history_uuid = ?",
    [historyUuid]
  );
  return mapHistory(rows[0]);
}

export async function findHistoryByDevice(
  deviceUuid: string,
  userUuid: string,
  limit = 20
): Promise<WolHistory[]> {
  const [rows] = await pool.execute<HistoryRow[]>(
    `SELECT h.*, d.name as device_name, d.mac_address
     FROM wol_history h
     JOIN devices d ON h.device_uuid = d.device_uuid
     WHERE h.device_uuid = ? AND h.user_uuid = ?
     ORDER BY h.created_at DESC
     LIMIT ?`,
    [deviceUuid, userUuid, limit]
  );
  return rows.map(mapHistory);
}

export async function findHistoryByUser(
  userUuid: string,
  limit = 50
): Promise<WolHistory[]> {
  const [rows] = await pool.execute<HistoryRow[]>(
    `SELECT h.*, d.name as device_name, d.mac_address
     FROM wol_history h
     JOIN devices d ON h.device_uuid = d.device_uuid
     WHERE h.user_uuid = ?
     ORDER BY h.created_at DESC
     LIMIT ?`,
    [userUuid, limit]
  );
  return rows.map(mapHistory);
}

export async function updateHistoryResponse(
  historyUuid: string
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "UPDATE wol_history SET device_responded_at = NOW() WHERE history_uuid = ?",
    [historyUuid]
  );
}
