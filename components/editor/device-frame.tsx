"use client";
import { ReactNode } from "react";
import classNames from "classnames";
import { DeviceConfig } from "./device-selector";

interface DeviceFrameProps {
  device: DeviceConfig;
  isRotated: boolean;
  children: ReactNode;
  className?: string;
}

export function DeviceFrame({
  device,
  isRotated,
  children,
  className,
}: DeviceFrameProps) {
  // Desktop doesn't need a frame
  if (device.type === "desktop") {
    return (
      <div className={classNames("relative w-full h-full", className)}>
        {children}
      </div>
    );
  }

  // Calculate dimensions based on rotation
  const width = isRotated ? device.height : device.width;
  const height = isRotated ? device.width : device.height;
  const bezelWidth = device.bezelWidth ?? 12;
  const borderRadius = device.borderRadius ?? 40;

  return (
    <div
      className={classNames(
        "relative flex items-center justify-center p-4",
        className
      )}
    >
      {/* Device outer shell */}
      <div
        className="relative bg-[#1a1a1a] shadow-2xl flex-shrink-0 transition-all duration-300"
        style={{
          width: width + bezelWidth * 2,
          height: height + bezelWidth * 2,
          borderRadius: borderRadius,
          padding: bezelWidth,
          maxWidth: "100%",
          maxHeight: "100%",
          transform: `scale(${Math.min(1, 400 / width, 700 / height)})`,
          transformOrigin: "center center",
        }}
      >
        {/* Subtle metallic edge highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: borderRadius,
            background: "linear-gradient(135deg, rgba(255,255,255,0.15) 0%, transparent 40%, rgba(0,0,0,0.2) 100%)",
          }}
        />
        
        {/* Screen area */}
        <div
          className="relative w-full h-full bg-black overflow-hidden"
          style={{
            borderRadius: Math.max(borderRadius - bezelWidth, 8),
          }}
        >
          {/* Dynamic Island - iPhone 15 Pro style */}
          {device.hasDynamicIsland && !isRotated && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30">
              <div
                className="bg-black rounded-[20px] flex items-center justify-center"
                style={{
                  width: 126,
                  height: 37,
                  boxShadow: "0 0 0 1px rgba(255,255,255,0.08)",
                }}
              >
                {/* Front camera lens */}
                <div className="absolute right-4 w-3 h-3 rounded-full bg-[#0d0d0d] ring-1 ring-neutral-700">
                  <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[#2a2a3a] to-[#1a1a2a]" />
                  <div className="absolute inset-1 rounded-full bg-[#0a0a15]" />
                </div>
              </div>
            </div>
          )}

          {/* Notch - iPhone 14 style */}
          {device.hasNotch && !isRotated && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-30">
              <div
                className="bg-black"
                style={{
                  width: 160,
                  height: 34,
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                }}
              >
                {/* Speaker grille */}
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-[#1a1a1a] rounded-full" />
                {/* Front camera */}
                <div className="absolute bottom-2.5 right-6 w-3 h-3 rounded-full bg-[#0d0d0d] ring-1 ring-neutral-800">
                  <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-[#2a3040] to-[#151520]" />
                </div>
              </div>
            </div>
          )}

          {/* Home indicator bar for modern iPhones */}
          {(device.hasDynamicIsland || device.hasNotch) && !isRotated && (
            <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 z-30">
              <div className="w-36 h-1.5 bg-white/40 rounded-full" />
            </div>
          )}

          {/* Iframe content - scrollable */}
          <div className="w-full h-full overflow-auto">
            {children}
          </div>
        </div>

        {/* Side buttons - Power (right) */}
        <div
          className="absolute -right-[2px] top-28 w-[3px] h-16 bg-[#2a2a2a] rounded-r-sm"
          style={{ boxShadow: "1px 0 2px rgba(0,0,0,0.3)" }}
        />
        
        {/* Side buttons - Volume (left) */}
        <div className="absolute -left-[2px] top-24 flex flex-col gap-3">
          <div
            className="w-[3px] h-8 bg-[#2a2a2a] rounded-l-sm"
            style={{ boxShadow: "-1px 0 2px rgba(0,0,0,0.3)" }}
          />
          <div
            className="w-[3px] h-8 bg-[#2a2a2a] rounded-l-sm"
            style={{ boxShadow: "-1px 0 2px rgba(0,0,0,0.3)" }}
          />
        </div>
        
        {/* Mute switch */}
        <div
          className="absolute -left-[2px] top-16 w-[3px] h-6 bg-[#2a2a2a] rounded-l-sm"
          style={{ boxShadow: "-1px 0 2px rgba(0,0,0,0.3)" }}
        />
      </div>
    </div>
  );
}
