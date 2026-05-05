"use client";
import * as React from "react";

/**
 * Service Worker 자동 갱신 + 새 버전 감지 시 reload.
 *
 * 동작:
 *  1) 마운트 시 + 포커스 시 + 30분마다 → registration.update() 호출
 *     → sw.js를 강제 fetch해서 새 SW 발견 시 install·activate 트리거
 *  2) controllerchange 이벤트 → 새 SW가 페이지 컨트롤 takeover한 시점
 *     → 1회 reload 해서 새 precache(HTML/JS) 적용
 *
 * 첫 방문 시 controller가 null → 처음 SW가 깔리면 controllerchange가 1회
 * 발생하는데, 이건 "새 버전"이 아니라 "처음 install"이라 reload 안 해야 함.
 * seenController 플래그로 구분.
 */
export function SwUpdater() {
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;

    let refreshing = false;
    // 마운트 시점에 controller가 있었으면 = 옛 SW 통제 중. controllerchange는 곧 "업데이트".
    // 없었으면 = 첫 install 직후 controllerchange가 한 번 오는데 그건 무시해야 함.
    let seenController = !!navigator.serviceWorker.controller;

    const onControllerChange = () => {
      if (refreshing) return;
      if (!seenController) {
        seenController = true;
        return;
      }
      refreshing = true;
      window.location.reload();
    };
    navigator.serviceWorker.addEventListener("controllerchange", onControllerChange);

    const checkUpdate = () => {
      navigator.serviceWorker
        .getRegistration()
        .then((reg) => reg?.update().catch(() => {}))
        .catch(() => {});
    };
    // 마운트 시 1회 + 포커스 시 + 30분 주기
    checkUpdate();
    const onFocus = () => checkUpdate();
    window.addEventListener("focus", onFocus);
    const id = window.setInterval(checkUpdate, 1000 * 60 * 30);

    return () => {
      navigator.serviceWorker.removeEventListener("controllerchange", onControllerChange);
      window.removeEventListener("focus", onFocus);
      window.clearInterval(id);
    };
  }, []);
  return null;
}
