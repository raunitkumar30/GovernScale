import React from "react";

const Input = ({
  label,
  type = "text",
  placeholder = "",
  value,
  onChange,
  name,
  id,
  required = false,
  error = "",
  helperText = "",
  icon = null,
  className = "",
  disabled = false,
  ...props
}) => {
  const inputId = id || name;

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-semibold text-slate-700 tracking-wide"
        >
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-slate-400">
            {icon}
          </div>
        )}

        <input
          id={inputId}
          name={name}
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          disabled={disabled}
          className={`
            w-full
            rounded-xl
            border
            ${
              error
                ? "border-rose-300 bg-rose-50/30 text-rose-900 focus:border-rose-500 focus:ring-rose-200"
                : "border-slate-200/90 bg-white text-slate-900 focus:border-[#154B38] focus:ring-[#154B38]/10"
            }
            ${icon ? "pl-10" : "px-4"}
            py-2.5 sm:py-3
            text-sm
            outline-none
            transition-all
            duration-200
            placeholder:text-slate-400
            focus:ring-4
            disabled:bg-slate-50 disabled:text-slate-400 disabled:cursor-not-allowed
            ${className}
          `}
          {...props}
        />
      </div>

      {error ? (
        <p className="text-xs font-medium text-rose-600">{error}</p>
      ) : helperText ? (
        <p className="text-xs text-slate-400">{helperText}</p>
      ) : null}
    </div>
  );
};

export default Input;