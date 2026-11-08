import React from "react";
import cn from "../../lib/cn";

/** Thin wrappers that keep every table in the product visually identical. */
export function Table({ className, children, ...props }) {
  return (
    <div className="overflow-x-auto">
      <table className={cn("w-full border-collapse text-left", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function THead({ children, className }) {
  return (
    <thead className={cn("bg-surface-2/70", className)}>
      <tr className="border-b border-line">{children}</tr>
    </thead>
  );
}

export function TBody({ children, className }) {
  return <tbody className={className}>{children}</tbody>;
}

export function Th({ className, children, ...props }) {
  return (
    <th scope="col" className={cn("th", className)} {...props}>
      {children}
    </th>
  );
}

export function Td({ className, children, ...props }) {
  return (
    <td className={cn("td", className)} {...props}>
      {children}
    </td>
  );
}

export function Tr({ className, children, ...props }) {
  return (
    <tr className={cn("row", className)} {...props}>
      {children}
    </tr>
  );
}
