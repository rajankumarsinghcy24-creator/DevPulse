import React from "react";

export const ProgressBar = ({
  progress = 0,
  size = "md",
  showLabel = true,
  showPercentage = true,
  label = "",
  className = ""
}) => {
  const clamped = Math.min(100, Math.max(0, Math.round(Number(progress) || 0)));

  const sizeClasses = {
    sm: "h-1.5",
    md: "h-2",
    lg: "h-2.5"
  };

  const getColorClasses = (val) => {
    if (val >= 80) return "bg-[#0F8B6D]";
    if (val >= 40) return "bg-[#2A9D8F]";
    return "bg-[#D97706]";
  };

  const getTextColor = (val) => {
    if (val >= 80) return "text-[#0F8B6D]";
    if (val >= 40) return "text-[#2A9D8F]";
    return "text-[#D97706]";
  };

  return (
    <div className={`w-full ${className}`}>
      {(showLabel || showPercentage) && (
        <div className="flex items-center justify-between text-xs mb-1.5 font-medium">
          {showLabel && <span className="text-[#667085]">{label}</span>}
          {showPercentage && (
            <span className={`font-mono font-semibold ml-auto ${getTextColor(clamped)}`}>
              {clamped}%
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={clamped}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
        className={`w-full bg-[#E7E7E0] rounded-full overflow-hidden ${sizeClasses[size] || sizeClasses.md}`}
      >
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${getColorClasses(clamped)}`}
          style={{ width: `${clamped}%` }}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
