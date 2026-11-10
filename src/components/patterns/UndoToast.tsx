import { toast } from "sonner";

/**
 * The 8-second soft-delete Undo toast (Requirement 20.2, 20.3). A toast is
 * triggered imperatively, not rendered as a child in the tree, so this is
 * a small helper around `sonner`'s `toast()` rather than a component —
 * kept under `patterns/` anyway, next to its sibling toast helpers, so a
 * reviewer finds every toast shape in one folder.
 */
function showUndoToast({
  message,
  undoLabel = "Undo",
  onUndo,
}: {
  message: string;
  undoLabel?: string;
  onUndo: () => void;
}) {
  toast(message, {
    duration: 8000,
    action: {
      label: undoLabel,
      onClick: onUndo,
    },
  });
}

export { showUndoToast };
