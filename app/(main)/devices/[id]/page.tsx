"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { DeviceForm } from "@/components/devices/DeviceForm";
import { DeviceStatusBadge } from "@/components/devices/DeviceStatusBadge";
import { WolButton } from "@/components/devices/WolButton";
import { WolHistoryTable } from "@/components/devices/WolHistoryTable";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";
import { useToast } from "@/components/providers/ToastProvider";
import { usePageVisible } from "@/hooks/usePageVisible";
import { useTimeAgo } from "@/hooks/useTimeAgo";
import type { Device, WolHistory } from "@/types/device";
import type { DeviceInput } from "@/lib/validations/device";

export default function DeviceDetailPage() {
  const router = useRouter();
  const params = useParams();
  const toast = useToast();
  const deviceId = params.id as string;
  const isVisible = usePageVisible();

  const [device, setDevice] = useState<Device | null>(null);
  const [history, setHistory] = useState<WolHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [fastMode, setFastMode] = useState(true);
  const [lastCheckedAt, setLastCheckedAt] = useState<number | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fetchingRef = useRef(false);

  const timeAgo = useTimeAgo(lastCheckedAt);

  const fetchDevice = useCallback(async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}`);
      const data = await response.json();
      if (data.success) {
        setDevice(data.data.device);
      } else {
        toast.error("장치를 찾을 수 없습니다");
        router.push("/");
      }
    } catch {
      toast.error("장치 조회 중 오류가 발생했습니다");
    }
  }, [deviceId, router, toast]);

  const fetchHistory = useCallback(async () => {
    try {
      const response = await fetch(`/api/devices/${deviceId}/history`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.data.history);
      }
    } catch {
      // 이력 조회 실패 무시
    }
  }, [deviceId]);

  // 상태 폴링
  const pollStatus = useCallback(async () => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;
    try {
      const response = await fetch(`/api/devices/${deviceId}/status`);
      const data = await response.json();
      if (data.success) {
        setDevice((prev) =>
          prev ? { ...prev, lastStatus: data.data.status } : null
        );
        setLastCheckedAt(Date.now());
        if (data.data.status !== "unknown") {
          setFastMode(false);
        }
      }
    } catch {
      // 무시
    } finally {
      fetchingRef.current = false;
    }
  }, [deviceId]);

  // 폴링 타이머
  useEffect(() => {
    if (!device?.ipAddress || !isVisible || isEditing) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    pollStatus();
    const ms = fastMode ? 1000 : 10000;
    timerRef.current = setInterval(pollStatus, ms);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [device?.ipAddress, isVisible, isEditing, fastMode, pollStatus]);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      await Promise.all([fetchDevice(), fetchHistory()]);
      setIsLoading(false);
    };
    load();
  }, [fetchDevice, fetchHistory]);

  const handleUpdate = async (data: DeviceInput) => {
    setIsSubmitting(true);
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await response.json();

      if (result.success) {
        setDevice(result.data.device);
        setIsEditing(false);
        toast.success("장치가 수정되었습니다");
      } else {
        toast.error(result.error || "장치 수정에 실패했습니다");
      }
    } catch {
      toast.error("장치 수정 중 오류가 발생했습니다");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/devices/${deviceId}`, {
        method: "DELETE",
      });
      const result = await response.json();

      if (result.success) {
        toast.success("장치가 삭제되었습니다");
        router.push("/");
      } else {
        toast.error(result.error || "장치 삭제에 실패했습니다");
      }
    } catch {
      toast.error("장치 삭제 중 오류가 발생했습니다");
    } finally {
      setIsDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const handleWake = useCallback(() => {
    setFastMode(true);
    fetchHistory();
  }, [fetchHistory]);

  if (isLoading) {
    return <Spinner className="py-20" />;
  }

  if (!device) return null;

  if (isEditing) {
    return (
      <div className="max-w-lg mx-auto">
        <h1 className="text-xl font-bold text-slate-100 mb-6">장치 수정</h1>
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <DeviceForm
            device={device}
            onSubmit={handleUpdate}
            onCancel={() => setIsEditing(false)}
            isSubmitting={isSubmitting}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 장치 정보 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <h1 className="text-xl font-bold text-slate-100">{device.name}</h1>
              {device.isFavorite && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              )}
            </div>
            <DeviceStatusBadge status={device.lastStatus} timeAgo={timeAgo} />
          </div>
          <WolButton
            deviceUuid={device.deviceUuid}
            deviceName={device.name}
            onWake={handleWake}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <span className="text-slate-500">MAC 주소</span>
            <p className="text-slate-200 font-mono">{device.macAddress}</p>
          </div>
          <div>
            <span className="text-slate-500">IP 주소</span>
            <p className="text-slate-200">{device.ipAddress || "-"}</p>
          </div>
          <div>
            <span className="text-slate-500">브로드캐스트</span>
            <p className="text-slate-200">{device.broadcastAddress}</p>
          </div>
          <div>
            <span className="text-slate-500">포트</span>
            <p className="text-slate-200">{device.port}</p>
          </div>
          <div>
            <span className="text-slate-500">반복</span>
            <p className="text-slate-200">
              {device.repeatCount}회 / {device.repeatIntervalMs}ms
            </p>
          </div>
          {device.memo && (
            <div className="sm:col-span-2">
              <span className="text-slate-500">메모</span>
              <p className="text-slate-200">{device.memo}</p>
            </div>
          )}
        </div>

        <div className="flex gap-2 mt-4 pt-4 border-t border-slate-800">
          <Button variant="secondary" size="sm" onClick={() => setIsEditing(true)}>
            수정
          </Button>
          <Button variant="danger" size="sm" onClick={() => setShowDeleteModal(true)}>
            삭제
          </Button>
          <div className="flex-1" />
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            목록으로
          </Button>
        </div>
      </div>

      {/* WoL 전송 이력 */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">전송 이력</h2>
        <WolHistoryTable history={history} />
      </div>

      {/* 삭제 확인 모달 */}
      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="장치 삭제"
      >
        <p className="text-sm text-slate-300 mb-6">
          <strong>{device.name}</strong>을(를) 삭제하시겠습니까?
          <br />
          삭제된 장치는 복구할 수 없습니다.
        </p>
        <div className="flex gap-3">
          <Button
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
            className="flex-1"
          >
            취소
          </Button>
          <Button
            variant="danger"
            isLoading={isDeleting}
            onClick={handleDelete}
            className="flex-1"
          >
            삭제
          </Button>
        </div>
      </Modal>
    </div>
  );
}
