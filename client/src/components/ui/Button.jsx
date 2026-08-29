import React from "react";

const Button = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  icon = null,
  className = "",
  ...props
}) => {
  const baseStyles =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 cursor-pointer disabled:cursor-not-allowed disabled:opacity-60 select-none";

  const sizeStyles = {
    xs: "px-3 py-1 text-xs rounded-full",
    sm: "px-3.5 py-1.5 text-xs font-semibold rounded-full",
    md: "px-5 py-2.5 text-sm rounded-full",
    lg: "px-6 py-3 text-base rounded-full font-semibold",
    icon: "h-9 w-9 p-0 rounded-full",
  };

  const variantStyles = {
    primary:
      "bg-[#154B38] text-white hover:bg-[#0D3427] active:scale-[0.98] shadow-sm hover:shadow",
    secondary:
      "bg-white border border-slate-200/90 text-slate-700 hover:bg-slate-50 hover:text-slate-900 hover:border-slate-300 active:scale-[0.98] shadow-sm",
    outline:
      "bg-transparent border border-[#154B38] text-[#154B38] hover:bg-[#154B38]/5 active:scale-[0.98]",
    ghost:
      "bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900",
    danger:
      "bg-rose-600 text-white hover:bg-rose-700 active:scale-[0.98] shadow-sm",
    success:
      "bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] shadow-sm",
    dark:
      "bg-slate-900 text-white hover:bg-slate-800 active:scale-[0.98] shadow-sm",
    emerald:
      "bg-[#10B981] text-white hover:bg-[#059669] active:scale-[0.98] shadow-sm",
  };

  const selectedVariant = variantStyles[variant] || variantStyles.primary;
  const selectedSize = sizeStyles[size] || sizeStyles.md;

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseStyles} ${selectedSize} ${selectedVariant} ${className}`}
      {...props}
    >
      {loading ? (
        <>
          <svg
            className="h-4 w-4 animate-spin text-current"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {icon && <span className="shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
};

export default Button;