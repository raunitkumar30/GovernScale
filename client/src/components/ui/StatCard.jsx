import React from "react";
import { ArrowUpRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

const StatCard = ({
  title,
  value,
  change,
  changeType = "positive",
  icon,
  featured = false,
  onAction,
  actionLabel,
  className = "",
}) => {
  if (featured) {
    return (
      <div
        className={`
          relative overflow-hidden
          rounded-2xl
          bg-forest-card-mesh
          text-white
          p-5 sm:p-6
          card-soft-shadow
          card-hover-effect
          border border-emerald-900/30
          flex flex-col justify-between
          ${className}
        `}
      >
        {/* Subtle decorative background glow */}
        <div className="pointer-events-none absolute -right-8 -top-8 h-28 w-28 rounded-full bg-emerald-400/10 blur-2xl" />

        {/* Top Header */}
        <div className="flex items-start justify-between gap-2">
          <p className="text-xs sm:text-sm font-medium text-emerald-100/90 tracking-wide">
            {title}
          </p>

          <button
            type="button"
            onClick={onAction}
            title={actionLabel || "View details"}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur-sm transition-all duration-200 hover:bg-white/25 hover:scale-105"
          >
            <ArrowUpRight size={16} />
          </button>
        </div>

        {/* Value */}
        <div className="my-3">
          <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white">
            {value}
          </h3>
        </div>

        {/* Bottom Change / Trend Pill */}
        {change && (
          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-emerald-200 backdrop-blur-sm border border-white/10">
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500/30 text-[10px] text-white">
                <ArrowUpRight size={11} />
              </span>
              <span>{change}</span>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      className={`
        rounded-2xl
        border border-slate-200/80
        bg-white
        p-5 sm:p-6
        card-soft-shadow
        card-hover-effect
        flex flex-col justify-between
        ${className}
      `}
    >
      {/* Top Header */}
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs sm:text-sm font-semibold text-slate-500">
          {title}
        </p>

        <button
          type="button"
          onClick={onAction}
          title={actionLabel || "View details"}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-all duration-200 hover:bg-slate-200 hover:text-slate-900 hover:scale-105"
        >
          <ArrowUpRight size={16} />
        </button>
      </div>

      {/* Value */}
      <div className="my-3">
        <h3 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900">
          {value}
        </h3>
      </div>

      {/* Bottom Change / Pill */}
      {change && (
        <div className="flex items-center gap-2">
          <div
            className={`
              inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold
              ${
                changeType === "positive"
                  ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
                  : changeType === "negative"
                  ? "bg-rose-50 text-rose-700 border border-rose-100"
                  : "bg-slate-100 text-slate-600 border border-slate-200"
              }
            `}
          >
            <span
              className={`
                flex h-4 w-4 items-center justify-center rounded-full text-[10px]
                ${
                  changeType === "positive"
                    ? "bg-emerald-200/70 text-emerald-800"
                    : changeType === "negative"
                    ? "bg-rose-200/70 text-rose-800"
                    : "bg-slate-200 text-slate-700"
                }
              `}
            >
              {changeType === "positive" ? (
                <ArrowUpRight size={11} />
              ) : changeType === "negative" ? (
                <TrendingDown size={11} />
              ) : (
                <Minus size={11} />
              )}
            </span>
            <span>{change}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatCard;