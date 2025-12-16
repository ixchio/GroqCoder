"use client";
import { useState } from "react";
import classNames from "classnames";
import { FaMobileAlt } from "react-icons/fa";
import { FaLaptopCode, FaTablet } from "react-icons/fa6";
import { ChevronDown, RotateCcw } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface DeviceConfig {
  id: string;
  name: string;
  type: "desktop" | "mobile" | "tablet";
  width: number;
  height: number;
  scale?: number;
  hasNotch?: boolean;
  hasDynamicIsland?: boolean;
  borderRadius?: number;
  bezelWidth?: number;
}

export const DEVICE_PRESETS: DeviceConfig[] = [
  // Desktop
  {
    id: "desktop",
    name: "Desktop",
    type: "desktop",
    width: 1920,
    height: 1080,
    borderRadius: 12,
  },
  // iPhones
  {
    id: "iphone-15-pro",
    name: "iPhone 15 Pro",
    type: "mobile",
    width: 393,
    height: 852,
    hasDynamicIsland: true,
    borderRadius: 55,
    bezelWidth: 12,
  },
  {
    id: "iphone-14",
    name: "iPhone 14",
    type: "mobile",
    width: 390,
    height: 844,
    hasNotch: true,
    borderRadius: 47,
    bezelWidth: 12,
  },
  {
    id: "iphone-se",
    name: "iPhone SE",
    type: "mobile",
    width: 375,
    height: 667,
    borderRadius: 24,
    bezelWidth: 12,
  },
  // Android
  {
    id: "galaxy-s24",
    name: "Galaxy S24",
    type: "mobile",
    width: 360,
    height: 780,
    borderRadius: 32,
    bezelWidth: 8,
  },
  {
    id: "pixel-8",
    name: "Pixel 8",
    type: "mobile",
    width: 412,
    height: 915,
    borderRadius: 36,
    bezelWidth: 10,
  },
  // Tablets
  {
    id: "ipad-pro-12",
    name: "iPad Pro 12.9\"",
    type: "tablet",
    width: 1024,
    height: 1366,
    borderRadius: 18,
    bezelWidth: 20,
  },
  {
    id: "ipad-mini",
    name: "iPad Mini",
    type: "tablet",
    width: 744,
    height: 1133,
    borderRadius: 18,
    bezelWidth: 16,
  },
];

interface DeviceSelectorProps {
  selectedDevice: DeviceConfig;
  isRotated: boolean;
  onDeviceChange: (device: DeviceConfig) => void;
  onRotateToggle: () => void;
}

export function DeviceSelector({
  selectedDevice,
  isRotated,
  onDeviceChange,
  onRotateToggle,
}: DeviceSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "mobile":
        return FaMobileAlt;
      case "tablet":
        return FaTablet;
      default:
        return FaLaptopCode;
    }
  };

  return (
    <div className="flex items-center gap-1 rounded-full p-0.5 bg-neutral-700/70 relative overflow-visible z-0">
      {/* Quick toggle buttons */}
      <div className="flex items-center gap-0.5">
        {["desktop", "mobile", "tablet"].map((type) => {
          const Icon = getDeviceIcon(type);
          const isActive = selectedDevice.type === type;
          return (
            <button
              key={type}
              className={classNames(
                "rounded-full size-7 flex items-center justify-center cursor-pointer transition-all duration-200",
                {
                  "bg-white text-black": isActive,
                  "text-neutral-300 hover:bg-neutral-600": !isActive,
                }
              )}
              onClick={() => {
                const firstOfType = DEVICE_PRESETS.find((d) => d.type === type);
                if (firstOfType) onDeviceChange(firstOfType);
              }}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
            >
              <Icon className="text-sm" />
            </button>
          );
        })}
      </div>

      {/* Device dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={classNames(
              "flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-full transition-all",
              "text-neutral-300 hover:bg-neutral-600",
              { "bg-neutral-600": isOpen }
            )}
          >
            <span className="max-w-[100px] truncate">{selectedDevice.name}</span>
            <ChevronDown
              className={classNames("size-3 transition-transform", {
                "rotate-180": isOpen,
              })}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-56 bg-neutral-900 border-neutral-700"
        >
          {/* Desktop */}
          <div className="px-2 py-1.5 text-xs text-neutral-500 font-medium">
            Desktop
          </div>
          {DEVICE_PRESETS.filter((d) => d.type === "desktop").map((device) => (
            <DropdownMenuItem
              key={device.id}
              onClick={() => onDeviceChange(device)}
              className={classNames(
                "flex items-center gap-2 cursor-pointer",
                { "bg-sky-500/20 text-sky-400": selectedDevice.id === device.id }
              )}
            >
              <FaLaptopCode className="size-4" />
              <span>{device.name}</span>
              <span className="ml-auto text-xs text-neutral-500">
                {device.width}×{device.height}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-neutral-700" />

          {/* Mobile */}
          <div className="px-2 py-1.5 text-xs text-neutral-500 font-medium">
            Mobile
          </div>
          {DEVICE_PRESETS.filter((d) => d.type === "mobile").map((device) => (
            <DropdownMenuItem
              key={device.id}
              onClick={() => onDeviceChange(device)}
              className={classNames(
                "flex items-center gap-2 cursor-pointer",
                { "bg-sky-500/20 text-sky-400": selectedDevice.id === device.id }
              )}
            >
              <FaMobileAlt className="size-4" />
              <div className="flex-1">
                <span>{device.name}</span>
                {device.hasDynamicIsland && (
                  <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-purple-500/20 text-purple-400">
                    Dynamic Island
                  </span>
                )}
                {device.hasNotch && (
                  <span className="ml-1.5 text-[10px] px-1 py-0.5 rounded bg-neutral-500/20 text-neutral-400">
                    Notch
                  </span>
                )}
              </div>
              <span className="text-xs text-neutral-500">
                {device.width}×{device.height}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-neutral-700" />

          {/* Tablet */}
          <div className="px-2 py-1.5 text-xs text-neutral-500 font-medium">
            Tablet
          </div>
          {DEVICE_PRESETS.filter((d) => d.type === "tablet").map((device) => (
            <DropdownMenuItem
              key={device.id}
              onClick={() => onDeviceChange(device)}
              className={classNames(
                "flex items-center gap-2 cursor-pointer",
                { "bg-sky-500/20 text-sky-400": selectedDevice.id === device.id }
              )}
            >
              <FaTablet className="size-4" />
              <span>{device.name}</span>
              <span className="ml-auto text-xs text-neutral-500">
                {device.width}×{device.height}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rotate button - only for non-desktop */}
      {selectedDevice.type !== "desktop" && (
        <>
          <div className="w-px h-4 bg-neutral-600" />
          <button
            className={classNames(
              "rounded-full size-7 flex items-center justify-center cursor-pointer transition-all duration-200",
              "text-neutral-300 hover:bg-neutral-600",
              { "bg-neutral-600 text-sky-400": isRotated }
            )}
            onClick={onRotateToggle}
            title="Rotate device"
          >
            <RotateCcw className={classNames("size-3.5 transition-transform", {
              "rotate-90": isRotated,
            })} />
          </button>
        </>
      )}
    </div>
  );
}
