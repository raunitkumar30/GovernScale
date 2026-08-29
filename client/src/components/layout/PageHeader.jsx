import React from "react";
import { Plus } from "lucide-react";
import Button from "../ui/Button";

const PageHeader = ({
  title,
  description,
  tag,
  actionLabel,
  onAction,
  actionIcon = <Plus size={16} />,
  secondaryActionLabel,
  onSecondaryAction,
  secondaryActionIcon,
  children,
}) => {
  return (
    <div className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      {/* Page Information */}
      <div className="min-w-0">
        {tag && (
          <p className="mb-1 text-xs font-bold uppercase tracking-wider text-[#154B38]">
            {tag}
          </p>
        )}

        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
          {title}
        </h1>

        {description && (
          <p className="mt-1 text-sm text-slate-500 font-medium">
            {description}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5 shrink-0">
        {secondaryActionLabel && (
          <Button
            variant="secondary"
            onClick={onSecondaryAction}
            icon={secondaryActionIcon}
          >
            {secondaryActionLabel}
          </Button>
        )}

        {actionLabel && (
          <Button
            variant="primary"
            onClick={onAction}
            icon={actionIcon}
          >
            {actionLabel}
          </Button>
        )}

        {children}
      </div>
    </div>
  );
};

export default PageHeader;