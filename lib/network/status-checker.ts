import net from "net";
import { exec } from "child_process";
import { logger } from "@/lib/logger";

const TCP_PROBE_PORTS = [22, 80, 135, 139, 445, 3389, 8080];
const TCP_TIMEOUT_MS = 1000;
const PING_TIMEOUT_MS = 1;  // ping -W 단위: 초

function pingHost(ip: string): Promise<boolean> {
  return new Promise((resolve) => {
    exec(
      `ping -c 1 -W ${PING_TIMEOUT_MS} ${ip}`,
      { timeout: 2000 },
      (error) => {
        const result = !error;
        logger.debug("STATUS", `ping ${ip} → ${result ? "응답" : "무응답"}`);
        resolve(result);
      }
    );
  });
}

function tcpProbe(ip: string, port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(TCP_TIMEOUT_MS);

    socket.on("connect", () => {
      logger.debug("STATUS", `TCP ${ip}:${port} → 연결됨`);
      socket.destroy();
      resolve(true);
    });

    socket.on("timeout", () => {
      socket.destroy();
      resolve(false);
    });

    socket.on("error", () => {
      socket.destroy();
      resolve(false);
    });

    socket.connect(port, ip);
  });
}

export async function checkDeviceStatus(ip: string): Promise<"online" | "offline"> {
  const startTime = Date.now();

  // ping + TCP 프로브 모두 동시에 시작, 하나라도 성공하면 online
  const results = await Promise.all([
    pingHost(ip),
    ...TCP_PROBE_PORTS.map((port) => tcpProbe(ip, port)),
  ]);

  const elapsed = Date.now() - startTime;
  const status = results.some((r) => r) ? "online" : "offline";

  const detail: Record<string, boolean> = { ping: results[0] };
  TCP_PROBE_PORTS.forEach((port, i) => {
    detail[`tcp${port}`] = results[i + 1];
  });

  logger.debug("STATUS", `${ip} 상태 확인 완료: ${status} (${elapsed}ms)`, detail);

  return status;
}
