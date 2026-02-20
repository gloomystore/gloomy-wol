import dgram from "dgram";
import { logger } from "@/lib/logger";

function parseMacAddress(mac: string): Buffer {
  const parts = mac.split(/[:-]/).map((part) => parseInt(part, 16));
  return Buffer.from(parts);
}

function createMagicPacket(mac: string): Buffer {
  const macBuffer = parseMacAddress(mac);
  const packet = Buffer.alloc(102);

  // 6바이트 0xFF
  for (let i = 0; i < 6; i++) {
    packet[i] = 0xff;
  }

  // MAC 주소 16회 반복
  for (let i = 0; i < 16; i++) {
    macBuffer.copy(packet, 6 + i * 6);
  }

  return packet;
}

interface WolOptions {
  broadcastAddress?: string;
  port?: number;
  repeatCount?: number;
  repeatIntervalMs?: number;
}

export async function sendMagicPacket(
  mac: string,
  options: WolOptions = {}
): Promise<void> {
  const {
    broadcastAddress = "192.168.0.255",
    port = 9,
    repeatCount = 3,
    repeatIntervalMs = 500,
  } = options;

  const packet = createMagicPacket(mac);

  logger.info("WOL", `매직 패킷 전송 시작`, {
    mac,
    broadcastAddress,
    port,
    repeatCount,
    repeatIntervalMs,
    packetSize: packet.length,
  });

  const sendOnce = (attempt: number): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socket = dgram.createSocket("udp4");

      socket.once("error", (err) => {
        logger.error("WOL", `UDP 소켓 오류 (${attempt}/${repeatCount}회)`, {
          mac,
          error: err.message,
        });
        socket.close();
        reject(err);
      });

      socket.bind(() => {
        socket.setBroadcast(true);
        socket.send(packet, 0, packet.length, port, broadcastAddress, (err) => {
          socket.close();
          if (err) {
            logger.error("WOL", `패킷 전송 실패 (${attempt}/${repeatCount}회)`, {
              mac,
              broadcastAddress,
              port,
              error: err.message,
            });
            reject(err);
          } else {
            logger.info("WOL", `패킷 전송 성공 (${attempt}/${repeatCount}회)`, {
              mac,
              broadcastAddress,
              port,
            });
            resolve();
          }
        });
      });
    });
  };

  for (let i = 0; i < repeatCount; i++) {
    await sendOnce(i + 1);
    if (i < repeatCount - 1) {
      await new Promise((resolve) => setTimeout(resolve, repeatIntervalMs));
    }
  }

  logger.info("WOL", `매직 패킷 전송 완료`, { mac, totalSent: repeatCount });
}
