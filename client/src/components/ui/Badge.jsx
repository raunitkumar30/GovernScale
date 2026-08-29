import React from "react";

const Badge = ({
  children,
  variant = "default",
  dot = false,
  className = "",
}) => {
  const variants = {
    default: "bg-slate-100 text-slate-700 border-slate-200",
    success: "bg-emerald-50 text-emerald-700 border-emerald-200/70",
    warning: "bg-amber-50 text-amber-700 border-amber-200/70",
    danger: "bg-rose-50 text-rose-700 border-rose-200/70",
    info: "bg-emerald-50 text-[#154B38] border-[#154B38]/20",
    forest: "bg-[#154B38] text-white border-transparent",
    sage: "bg-[#EBF6F0] text-[#154B38] border-[#D1EBDD]",
    pending: "bg-rose-50 text-rose-600 border-rose-100",
    inProgress: "bg-amber-50 text-amber-700 border-amber-100",
    completed: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  const dotColors = {
    default: "bg-slate-400",
    success: "bg-emerald-500",
    warning: "bg-amber-500",
    danger: "bg-rose-500",
    info: "bg-[#154B38]",
    forest: "bg-emerald-400",
    sage: "bg-[#154B38]",
    pending: "bg-rose-500",
    inProgress: "bg-amber-500",
    completed: "bg-emerald-500",
  };

  const selectedVariant = variants[variant] || variants.default;
  const selectedDot = dotColors[variant] || dotColors.default;

  return (
    <span
      className={`
        inline-flex items-center gap-1.5
        rounded-full
        border
        px-2.5 py-0.5
        text-xs font-semibold
        tracking-wide
        select-none
        ${selectedVariant}
        ${className}
      `}
    >
      {dot && (
        <span className={`h-1.5 w-1.5 rounded-full ${selectedDot}`} />
      )}
      {children}
    </span>
  );
};

export default Badge;