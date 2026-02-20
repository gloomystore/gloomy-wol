import { v4 as uuidv4 } from "uuid";
import pool from "../connection";
import type { Device, DeviceFormData } from "@/types/device";
import type { RowDataPacket, ResultSetHeader } from "mysql2";

interface DeviceRow extends RowDataPacket {
  device_uuid: string;
  user_uuid: string;
  name: string;
  mac_address: string;
  ip_address: string | null;
  broadcast_address: string;
  port: number;
  memo: string | null;
  repeat_count: number;
  repeat_interval_ms: number;
  last_status: "online" | "offline" | "unknown";
  last_status_checked_at: Date | null;
  is_favorite: number;
  sort_order: number;
  created_at: Date;
  updated_at: Date;
}

function mapDevice(row: DeviceRow): Device {
  return {
    deviceUuid: row.device_uuid,
    userUuid: row.user_uuid,
    name: row.name,
    macAddress: row.mac_address,
    ipAddress: row.ip_address,
    broadcastAddress: row.broadcast_address,
    port: row.port,
    memo: row.memo,
    repeatCount: row.repeat_count,
    repeatIntervalMs: row.repeat_interval_ms,
    lastStatus: row.last_status,
    lastStatusCheckedAt: row.last_status_checked_at,
    isFavorite: row.is_favorite === 1,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function findDevicesByUser(userUuid: string): Promise<Device[]> {
  const [rows] = await pool.execute<DeviceRow[]>(
    "SELECT * FROM devices WHERE user_uuid = ? ORDER BY is_favorite DESC, sort_order ASC, created_at DESC",
    [userUuid]
  );
  return rows.map(mapDevice);
}

export async function findDeviceByUuid(
  deviceUuid: string,
  userUuid: string
): Promise<Device | null> {
  const [rows] = await pool.execute<DeviceRow[]>(
    "SELECT * FROM devices WHERE device_uuid = ? AND user_uuid = ?",
    [deviceUuid, userUuid]
  );
  if (rows.length === 0) return null;
  return mapDevice(rows[0]);
}

export async function findDeviceByUuidOnly(
  deviceUuid: string
): Promise<Device | null> {
  const [rows] = await pool.execute<DeviceRow[]>(
    "SELECT * FROM devices WHERE device_uuid = ?",
    [deviceUuid]
  );
  if (rows.length === 0) return null;
  return mapDevice(rows[0]);
}

export async function createDevice(
  userUuid: string,
  data: DeviceFormData
): Promise<Device> {
  const deviceUuid = uuidv4();
  await pool.execute<ResultSetHeader>(
    `INSERT INTO devices (device_uuid, user_uuid, name, mac_address, ip_address, broadcast_address, port, memo, repeat_count, repeat_interval_ms, is_favorite)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      deviceUuid,
      userUuid,
      data.name,
      data.macAddress.toUpperCase(),
      data.ipAddress || null,
      data.broadcastAddress || "192.168.0.255",
      data.port || 9,
      data.memo || null,
      data.repeatCount || 3,
      data.repeatIntervalMs || 500,
      data.isFavorite ? 1 : 0,
    ]
  );
  const device = await findDeviceByUuid(deviceUuid, userUuid);
  if (!device) throw new Error("Failed to create device");
  return device;
}

export async function updateDevice(
  deviceUuid: string,
  userUuid: string,
  data: Partial<DeviceFormData>
): Promise<Device | null> {
  const fields: string[] = [];
  const values: unknown[] = [];

  if (data.name !== undefined) {
    fields.push("name = ?");
    values.push(data.name);
  }
  if (data.macAddress !== undefined) {
    fields.push("mac_address = ?");
    values.push(data.macAddress.toUpperCase());
  }
  if (data.ipAddress !== undefined) {
    fields.push("ip_address = ?");
    values.push(data.ipAddress || null);
  }
  if (data.broadcastAddress !== undefined) {
    fields.push("broadcast_address = ?");
    values.push(data.broadcastAddress);
  }
  if (data.port !== undefined) {
    fields.push("port = ?");
    values.push(data.port);
  }
  if (data.memo !== undefined) {
    fields.push("memo = ?");
    values.push(data.memo || null);
  }
  if (data.repeatCount !== undefined) {
    fields.push("repeat_count = ?");
    values.push(data.repeatCount);
  }
  if (data.repeatIntervalMs !== undefined) {
    fields.push("repeat_interval_ms = ?");
    values.push(data.repeatIntervalMs);
  }
  if (data.isFavorite !== undefined) {
    fields.push("is_favorite = ?");
    values.push(data.isFavorite ? 1 : 0);
  }

  if (fields.length === 0) return findDeviceByUuid(deviceUuid, userUuid);

  values.push(deviceUuid, userUuid);
  await pool.execute<ResultSetHeader>(
    `UPDATE devices SET ${fields.join(", ")} WHERE device_uuid = ? AND user_uuid = ?`,
    values
  );

  return findDeviceByUuid(deviceUuid, userUuid);
}

export async function deleteDevice(
  deviceUuid: string,
  userUuid: string
): Promise<boolean> {
  const [result] = await pool.execute<ResultSetHeader>(
    "DELETE FROM devices WHERE device_uuid = ? AND user_uuid = ?",
    [deviceUuid, userUuid]
  );
  return result.affectedRows > 0;
}

export async function updateDeviceStatus(
  deviceUuid: string,
  status: "online" | "offline" | "unknown"
): Promise<void> {
  await pool.execute<ResultSetHeader>(
    "UPDATE devices SET last_status = ?, last_status_checked_at = NOW() WHERE device_uuid = ?",
    [status, deviceUuid]
  );
}
