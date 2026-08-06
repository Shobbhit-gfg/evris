"use client";

import { useState } from "react";
import Image from "next/image";

type EventItem = {
  title: string;
  description: string;
  image: string;
};

export default function EventStack({ items }: { items: EventItem[] }) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const renderOrder = [...items.keys()];
  if (hoveredIndex !== null) {
    renderOrder.splice(renderOrder.indexOf(hoveredIndex), 1);
    renderOrder.push(hoveredIndex);
  }

  return (
    <div className="relative h-[420px] w-full max-w-[1210px]">
      {renderOrder.map((i) => {
        const item = items[i];
        const isHovered = hoveredIndex === i;
        const isMain = isHovered || (hoveredIndex === null && i === 0);

        return (
          <div
            key={item.title}
            onMouseEnter={() => setHoveredIndex(i)}
            onMouseLeave={() => setHoveredIndex(null)}
            className="
              absolute top-0 h-[360px] w-[444px] overflow-hidden rounded-[10px]
              bg-[#fffafa] transition-all duration-300 ease-out
              cursor-pointer
            "
            style={{
              left: `${i * 222}px`,
              zIndex: isHovered ? 999 : items.length - i,
              transform: isMain ? "translateY(-12px) scale(1.03)" : "translateY(0) scale(1)",
              boxShadow: isMain
                ? "-14px 8px 33.6px 8px rgba(0,0,0,0.25)"
                : "0 4px 20px rgba(0,0,0,0.06)",
              border: isMain ? "none" : "1px solid rgba(0,0,0,0.1)",
            }}
          >
            <div className="relative h-[178px] w-full">
              <Image src={item.image} alt={item.title} fill className="object-cover" />
            </div>
            <p className="body-font px-6 pt-4 text-[16px] leading-relaxed text-[#6e6e73]">
              {item.description}
            </p>
          </div>
        );
      })}
    </div>
  );
}