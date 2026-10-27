import React from "react";

export const Badge = ({
  children,
  variant = "default",
  size = "md",
  dot = false,
  className = ""
}) => {
  const sizeStyles = {
    sm: "text-[11px] px-2 py-0.5 font-medium",
    md: "text-xs px-2.5 py-0.5 font-medium",
    lg: "text-sm px-3 py-1 font-semibold"
  };

  const normalized = String(variant).toLowerCase().replace("_", "-");

  const variantStyles = {
    // Task & Project Statuses
    "in-progress": "bg-[#EAF6F5] text-[#2A9D8F] border border-[#D5ECE9]",
    done: "bg-[#E8F5F0] text-[#0F8B6D] border border-[#B8EAD9]",
    completed: "bg-[#E8F5F0] text-[#0F8B6D] border border-[#B8EAD9]",
    active: "bg-[#E8F5F0] text-[#0F8B6D] border border-[#B8EAD9]",
    todo: "bg-[#F7F7F2] text-[#667085] border border-[#E7E7E0]",
    archived: "bg-[#F7F7F2] text-[#98A2B3] border border-[#E7E7E0]",

    // Priorities
    high: "bg-[#FDF2F2] text-[#C94C4C] border border-[#FDE2E2]",
    medium: "bg-[#FEF7EC] text-[#D97706] border border-[#FEE3B8]",
    low: "bg-[#F7F7F2] text-[#667085] border border-[#E7E7E0]",

    // Generic
    default: "bg-[#F7F7F2] text-[#1F2933] border border-[#E7E7E0]",
    primary: "bg-[#E8F5F0] text-[#0F8B6D] border border-[#B8EAD9]"
  };

  const dotColors = {
    "in-progress": "bg-[#2A9D8F]",
    done: "bg-[#0F8B6D]",
    completed: "bg-[#0F8B6D]",
    active: "bg-[#0F8B6D]",
    todo: "bg-[#98A2B3]",
    archived: "bg-[#98A2B3]",
    high: "bg-[#C94C4C]",
    medium: "bg-[#D97706]",
    low: "bg-[#98A2B3]",
    default: "bg-[#98A2B3]",
    primary: "bg-[#0F8B6D]"
  };

  const currentVariant = variantStyles[normalized] || variantStyles.default;
  const currentDot = dotColors[normalized] || "bg-[#98A2B3]";

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full capitalize whitespace-nowrap ${sizeStyles[size] || sizeStyles.md} ${currentVariant} ${className}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${currentDot}`} />}
      {children}
    </span>
  );
};

export default Badge;
