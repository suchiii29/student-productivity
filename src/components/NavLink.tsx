// src/components/NavLink.tsx
import { forwardRef } from "react";
import { NavLink as RouterNavLink, NavLinkProps } from "react-router-dom";

export const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  ({ className, ...props }, ref) => {
    return (
      <RouterNavLink
        ref={ref}
        className={className}
        {...props}
      />
    );
  }
);

NavLink.displayName = "NavLink";