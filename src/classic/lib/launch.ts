/**
 * One way in to a project from anywhere on the page (the status board, the
 * palette, the stack): if the project is on the Work stage, the stage plays it
 * and scrolls into view; anything else opens its sheet.
 */
type StageHandler = (projectId: string) => boolean;

let stage: StageHandler | null = null;

/** The stage registers itself while it's mounted. Returns the unregister. */
export function registerStage(fn: StageHandler) {
  stage = fn;
  return () => {
    if (stage === fn) stage = null;
  };
}

export function launchProject(projectId: string, openSheet: (id: string) => void) {
  if (stage?.(projectId)) return;
  openSheet(projectId);
}
