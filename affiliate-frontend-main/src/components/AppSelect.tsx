import type { ComponentPropsWithRef } from "react";
import AppIcon from "@/components/AppIcon";

/** Native keyboard and mobile selection, with a consistently inset Hugeicons chevron. */
export default function AppSelect({ className = "", multiple, size, ...props }: ComponentPropsWithRef<"select">) {
  if (multiple || (size && size > 1)) return <select {...props} className={className} multiple={multiple} size={size} />;
  return <span className="app-select-control"><select {...props} size={size} className={`app-select ${className}`} /><AppIcon name="chevron-down" className="app-select-chevron" /></span>;
}
