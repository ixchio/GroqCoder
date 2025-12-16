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
  // Calculate dimensions based on rotation
  const width = isRotated ? device.height : device.width;
  const height = isRotated ? device.width : device.height;
  const bezelWidth = device.bezelWidth ?? 12;
  
  // Scale the device to fit in the viewport
  const maxWidth = typeof window !== "undefined" ? window.innerWidth * 0.45 : 400;
  const maxHeight = typeof window !== "undefined" ? window.innerHeight * 0.75 : 700;
  
  const scaleX = maxWidth / (width + bezelWidth * 2);
  const scaleY = maxHeight / (height + bezelWidth * 2);
  const scale = Math.min(scaleX, scaleY, 1);

  // Desktop doesn't need a frame
  if (device.type === "desktop") {
    return (
      <div className={classNames("relative", className)}>
        {children}
      </div>
    );
  }

  return (
    <div
      className={classNames(
        "relative transition-all duration-500 ease-out",
        className
      )}
      style={{
        transform: `scale(${scale})`,
        transformOrigin: "center center",
      }}
    >
      {/* Device outer frame */}
      <div
        className="relative bg-gradient-to-b from-neutral-700 via-neutral-800 to-neutral-900 shadow-2xl"
        style={{
          width: width + bezelWidth * 2,
          height: height + bezelWidth * 2,
          borderRadius: device.borderRadius ?? 24,
          padding: bezelWidth,
        }}
      >
        {/* Metallic edge effect */}
        <div
          className="absolute inset-0 rounded-[inherit] pointer-events-none"
          style={{
            background: "linear-gradient(145deg, rgba(255,255,255,0.1) 0%, transparent 50%, rgba(0,0,0,0.3) 100%)",
            borderRadius: device.borderRadius ?? 24,
          }}
        />
        
        {/* Inner screen bezel */}
        <div
          className="relative bg-black overflow-hidden"
          style={{
            width,
            height,
            borderRadius: Math.max((device.borderRadius ?? 24) - bezelWidth, 8),
          }}
        >
          {/* Dynamic Island for iPhone 15 Pro */}
          {device.hasDynamicIsland && !isRotated && (
            <div className="absolute top-2 left-1/2 -translate-x-1/2 z-20 flex items-center justify-center">
              <div
                className="bg-black rounded-full shadow-lg"
                style={{
                  width: 120,
                  height: 35,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5), inset 0 1px 2px rgba(255,255,255,0.1)",
                }}
              >
                {/* Camera dot */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full bg-[#1a1a1a] ring-1 ring-neutral-700">
                  <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-neutral-600 to-neutral-800" />
                </div>
              </div>
            </div>
          )}

          {/* Rotated Dynamic Island */}
          {device.hasDynamicIsland && isRotated && (
            <div className="absolute left-2 top-1/2 -translate-y-1/2 z-20">
              <div
                className="bg-black rounded-full shadow-lg"
                style={{
                  width: 35,
                  height: 120,
                  boxShadow: "0 2px 8px rgba(0,0,0,0.5)",
                }}
              />
            </div>
          )}

          {/* Notch for iPhone 14 */}
          {device.hasNotch && !isRotated && (
            <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
              <div
                className="bg-black"
                style={{
                  width: 150,
                  height: 34,
                  borderBottomLeftRadius: 20,
                  borderBottomRightRadius: 20,
                  boxShadow: "0 2px 4px rgba(0,0,0,0.3)",
                }}
              >
                {/* Speaker */}
                <div className="absolute top-2.5 left-1/2 -translate-x-1/2 w-16 h-1.5 bg-neutral-800 rounded-full" />
                {/* Camera */}
                <div className="absolute top-2 right-8 w-3 h-3 rounded-full bg-[#1a1a1a] ring-1 ring-neutral-700">
                  <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-blue-900/30 to-neutral-800" />
                </div>
              </div>
            </div>
          )}

          {/* Home indicator for modern iPhones */}
          {(device.hasDynamicIsland || device.hasNotch) && !isRotated && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 z-20">
              <div className="w-32 h-1 bg-white/30 rounded-full" />
            </div>
          )}

          {/* Side buttons simulation */}
          {device.type === "mobile" && (
            <>
              {/* Power button */}
              <div
                className="absolute -right-[3px] top-24 w-[3px] h-14 bg-gradient-to-b from-neutral-600 via-neutral-700 to-neutral-600 rounded-r-sm"
                style={{
                  boxShadow: "1px 0 2px rgba(0,0,0,0.3)",
                }}
              />
              {/* Volume buttons */}
              <div className="absolute -left-[3px] top-20">
                <div
                  className="w-[3px] h-8 bg-gradient-to-b from-neutral-600 via-neutral-700 to-neutral-600 rounded-l-sm mb-2"
                  style={{ boxShadow: "-1px 0 2px rgba(0,0,0,0.3)" }}
                />
                <div
                  className="w-[3px] h-8 bg-gradient-to-b from-neutral-600 via-neutral-700 to-neutral-600 rounded-l-sm"
                  style={{ boxShadow: "-1px 0 2px rgba(0,0,0,0.3)" }}
                />
              </div>
            </>
          )}

          {/* Content */}
          <div className="w-full h-full relative">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
