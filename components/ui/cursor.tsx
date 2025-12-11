"use client";

import { useEffect, useState } from "react";

export function Cursor() {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isPointer, setIsPointer] = useState(false);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setPosition({ x: e.clientX, y: e.clientY });
      
      const target = e.target as HTMLElement;
      setIsPointer(
        window.getComputedStyle(target).cursor === "pointer" ||
        target.tagName === "BUTTON" ||
        target.tagName === "A"
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <>
      <div
        className="fixed top-0 left-0 w-4 h-4 rounded-full bg-white mix-blend-difference pointer-events-none z-[9999] transition-transform duration-100 ease-out"
        style={{
          transform: `translate(${position.x - 8}px, ${position.y - 8}px) scale(${isPointer ? 2.5 : 1})`,
        }}
      />
      <div
        className="fixed top-0 left-0 w-8 h-8 rounded-full border border-white/30 pointer-events-none z-[9998] transition-transform duration-300 ease-out"
        style={{
          transform: `translate(${position.x - 16}px, ${position.y - 16}px) scale(${isPointer ? 1.5 : 1})`,
        }}
      />
    </>
  );
}
