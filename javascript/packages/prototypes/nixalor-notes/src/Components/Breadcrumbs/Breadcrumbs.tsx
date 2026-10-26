import { Fragment, memo, useMemo } from "react";
import { useNotes } from "../../Providers/NotesProvider/NotesContext";
import { getFolderPath } from "../../Shared/Utils/folderTree";
import classes from "./Breadcrumbs.module.css";
import type { BreadcrumbsProps } from "./BreadcrumbsTypes";

const Breadcrumbs = memo<BreadcrumbsProps>(({ folderId, current }) => {
  const { folders, navigate } = useNotes();
  const path = useMemo(() => getFolderPath(folderId, folders), [folderId, folders]);

  const crumbs = path.map((folder) => ({
    key: folder.id,
    label: folder.name,
    onClick: () => navigate({ type: "folder", id: folder.id }),
  }));

  return (
    <nav className={classes.breadcrumbs} aria-label="Breadcrumbs">
      {crumbs.map((crumb, index) => (
        <Fragment key={crumb.key}>
          {index > 0 && <span className={classes.separator}>/</span>}
          <button type="button" className={classes.link} onClick={crumb.onClick}>
            {crumb.label}
          </button>
        </Fragment>
      ))}
      {current && (
        <>
          {crumbs.length > 0 && <span className={classes.separator}>/</span>}
          <span className={classes.current}>{current}</span>
        </>
      )}
    </nav>
  );
});
Breadcrumbs.displayName = "Breadcrumbs";

export { Breadcrumbs };
