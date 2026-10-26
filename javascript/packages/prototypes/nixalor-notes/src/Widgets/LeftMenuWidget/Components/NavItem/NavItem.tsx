import { memo } from "react";
import classes from "./NavItem.module.css";
import type { NavItemProps } from "./NavItemTypes";

const NavItem = memo<NavItemProps>(
  ({ icon, label, count, isActive = false, onClick }) => (
    <button
      type="button"
      className={classes.navItem}
      aria-current={isActive ? "page" : undefined}
      onClick={onClick}
    >
      <span className={classes.icon}>{icon}</span>
      <span className={classes.label}>{label}</span>
      {count !== undefined && count > 0 && <span className={classes.count}>{count}</span>}
    </button>
  )
);
NavItem.displayName = "NavItem";

export { NavItem };
