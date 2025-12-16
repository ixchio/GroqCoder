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
    bezelWidth: 10,
  },
  {
    id: "iphone-14",
    name: "iPhone 14",
    type: "mobile",
    width: 390,
    height: 844,
    hasNotch: true,
    borderRadius: 47,
    bezelWidth: 10,
  },
  {
    id: "iphone-se",
    name: "iPhone SE",
    type: "mobile",
    width: 375,
    height: 667,
    borderRadius: 30,
    bezelWidth: 10,
  },
  // Android
  {
    id: "galaxy-s24",
    name: "Galaxy S24",
    type: "mobile",
    width: 360,
    height: 780,
    borderRadius: 35,
    bezelWidth: 8,
  },
  {
    id: "pixel-8",
    name: "Pixel 8",
    type: "mobile",
    width: 412,
    height: 915,
    borderRadius: 40,
    bezelWidth: 8,
  },
  // Tablets
  {
    id: "ipad-pro",
    name: "iPad Pro",
    type: "tablet",
    width: 1024,
    height: 1366,
    borderRadius: 22,
    bezelWidth: 16,
  },
  {
    id: "ipad-mini",
    name: "iPad Mini",
    type: "tablet",
    width: 744,
    height: 1133,
    borderRadius: 22,
    bezelWidth: 14,
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
    <div className="flex items-center gap-1 rounded-lg p-1 bg-neutral-800/80 backdrop-blur-sm border border-neutral-700/50">
      {/* Quick toggle buttons */}
      <div className="flex items-center gap-0.5">
        {(["desktop", "mobile", "tablet"] as const).map((type) => {
          const Icon = getDeviceIcon(type);
          const isActive = selectedDevice.type === type;
          return (
            <button
              key={type}
              className={classNames(
                "rounded-md size-8 flex items-center justify-center cursor-pointer transition-all duration-150",
                {
                  "bg-white text-black shadow-sm": isActive,
                  "text-neutral-400 hover:text-white hover:bg-neutral-700": !isActive,
                }
              )}
              onClick={() => {
                const firstOfType = DEVICE_PRESETS.find((d) => d.type === type);
                if (firstOfType) onDeviceChange(firstOfType);
              }}
              title={type.charAt(0).toUpperCase() + type.slice(1)}
            >
              <Icon className="size-4" />
            </button>
          );
        })}
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-neutral-700" />

      {/* Device dropdown */}
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <button
            className={classNames(
              "flex items-center gap-1.5 text-xs font-medium px-2 py-1.5 rounded-md transition-all",
              "text-neutral-300 hover:text-white hover:bg-neutral-700",
              { "bg-neutral-700 text-white": isOpen }
            )}
          >
            <span className="max-w-[80px] truncate">{selectedDevice.name}</span>
            <ChevronDown
              className={classNames("size-3 transition-transform duration-200", {
                "rotate-180": isOpen,
              })}
            />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          className="w-52 bg-neutral-900/95 backdrop-blur-md border-neutral-700"
        >
          {/* Group: Desktop */}
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
            Desktop
          </div>
          {DEVICE_PRESETS.filter((d) => d.type === "desktop").map((device) => (
            <DropdownMenuItem
              key={device.id}
              onClick={() => onDeviceChange(device)}
              className={classNames(
                "flex items-center gap-2 cursor-pointer text-sm",
                { "bg-sky-500/20 text-sky-400": selectedDevice.id === device.id }
              )}
            >
              <FaLaptopCode className="size-3.5" />
              <span className="flex-1">{device.name}</span>
              <span className="text-[10px] text-neutral-500">
                {device.width}×{device.height}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-neutral-700/50" />

          {/* Group: Mobile */}
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
            Mobile
          </div>
          {DEVICE_PRESETS.filter((d) => d.type === "mobile").map((device) => (
            <DropdownMenuItem
              key={device.id}
              onClick={() => onDeviceChange(device)}
              className={classNames(
                "flex items-center gap-2 cursor-pointer text-sm",
                { "bg-sky-500/20 text-sky-400": selectedDevice.id === device.id }
              )}
            >
              <FaMobileAlt className="size-3.5" />
              <span className="flex-1">{device.name}</span>
              <span className="text-[10px] text-neutral-500">
                {device.width}×{device.height}
              </span>
            </DropdownMenuItem>
          ))}

          <DropdownMenuSeparator className="bg-neutral-700/50" />

          {/* Group: Tablet */}
          <div className="px-2 py-1 text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
            Tablet
          </div>
          {DEVICE_PRESETS.filter((d) => d.type === "tablet").map((device) => (
            <DropdownMenuItem
              key={device.id}
              onClick={() => onDeviceChange(device)}
              className={classNames(
                "flex items-center gap-2 cursor-pointer text-sm",
                { "bg-sky-500/20 text-sky-400": selectedDevice.id === device.id }
              )}
            >
              <FaTablet className="size-3.5" />
              <span className="flex-1">{device.name}</span>
              <span className="text-[10px] text-neutral-500">
                {device.width}×{device.height}
              </span>
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Rotate button - only for non-desktop */}
      {selectedDevice.type !== "desktop" && (
        <>
          <div className="w-px h-5 bg-neutral-700" />
          <button
            className={classNames(
              "rounded-md size-8 flex items-center justify-center cursor-pointer transition-all duration-150",
              "text-neutral-400 hover:text-white hover:bg-neutral-700",
              { "bg-sky-500/20 text-sky-400": isRotated }
            )}
            onClick={onRotateToggle}
            title={isRotated ? "Portrait" : "Landscape"}
          >
            <RotateCcw className={classNames("size-4 transition-transform duration-200", {
              "rotate-90": isRotated,
            })} />
          </button>
        </>
      )}
    </div>
  );
}
