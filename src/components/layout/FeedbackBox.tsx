import { MessageSquarePlus } from "lucide-react";

import { APP_VERSION } from "@/lib/constants";
import { Button } from "@/components/ui/button";

/**
 * The dashed "Usability Feedback" box (Requirement 6.4, 21.1), present near
 * the bottom of the sidebar on every authenticated screen for every role.
 * The actual capture dialog (`ObservationDialog`) is built in Phase 6
 * (task 6.1); this component only renders the box and calls back when the
 * button is pressed, so it has nothing to change when that dialog arrives.
 */
function FeedbackBox({ onAddObservation }: { onAddObservation?: () => void }) {
  return (
    <div className="mx-3 mb-3 rounded-md border border-dashed border-dusk-600 p-3">
      <p className="text-sm font-medium text-white">Usability Feedback</p>
      <p className="mt-1 text-xs text-dusk-400">
        {APP_VERSION} · Ready for testing
      </p>
      <Button
        type="button"
        variant="secondary"
        size="default"
        className="mt-3 w-full justify-start gap-2 bg-navy-700 text-white border-navy-500 hover:bg-navy-600"
        onClick={onAddObservation}
      >
        <MessageSquarePlus className="size-4" aria-hidden="true" />
        <span>+ Add observation</span>
      </Button>
    </div>
  );
}

export { FeedbackBox };
