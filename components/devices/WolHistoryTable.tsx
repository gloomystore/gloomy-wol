"use client";

import { format } from "date-fns";
import { ko } from "date-fns/locale";
import type { WolHistory } from "@/types/device";

interface WolHistoryTableProps {
  history: WolHistory[];
}

export function WolHistoryTable({ history }: WolHistoryTableProps) {
  if (history.length === 0) {
    return (
      <p className="text-sm text-slate-500 text-center py-6">
        전송 이력이 없습니다
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-800">
            <th className="text-left py-2 px-3 text-slate-400 font-medium">시간</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">결과</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium hidden sm:table-cell">응답</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium hidden md:table-cell">오류</th>
          </tr>
        </thead>
        <tbody>
          {history.map((h) => (
            <tr
              key={h.historyUuid}
              className="border-b border-slate-800/50 hover:bg-slate-800/30"
            >
              <td className="py-2 px-3 text-slate-300 whitespace-nowrap">
                {format(new Date(h.createdAt), "MM/dd HH:mm:ss", { locale: ko })}
              </td>
              <td className="py-2 px-3">
                <span
                  className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    h.result === "success"
                      ? "bg-green-900/50 text-green-400"
                      : "bg-red-900/50 text-red-400"
                  }`}
                >
                  {h.result === "success" ? "성공" : "실패"}
                </span>
              </td>
              <td className="py-2 px-3 text-slate-400 hidden sm:table-cell">
                {h.deviceRespondedAt
                  ? format(new Date(h.deviceRespondedAt), "HH:mm:ss")
                  : "-"}
              </td>
              <td className="py-2 px-3 text-slate-500 text-xs hidden md:table-cell truncate max-w-[200px]">
                {h.errorMessage || "-"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
