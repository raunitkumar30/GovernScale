import React from "react";

const Card = ({
  children,
  className = "",
  variant = "default",
  hoverable = false,
  ...props
}) => {
  const variantClasses = {
    default: "bg-white border border-slate-200/80 text-slate-900",
    featured: "bg-forest-card-mesh text-white border border-emerald-900/40",
    subtle: "bg-slate-50/80 border border-slate-200/60 text-slate-900",
    glass: "bg-white/80 backdrop-blur-md border border-white/60 text-slate-900",
  };

  const selectedVariant = variantClasses[variant] || variantClasses.default;
  const hoverClass = hoverable ? "card-hover-effect cursor-pointer" : "";

  return (
    <div
      className={`
        rounded-2xl
        p-5 sm:p-6
        card-soft-shadow
        ${selectedVariant}
        ${hoverClass}
        ${className}
      `}
      {...props}
    >
      {children}
    </div>
  );
};

export default Card;