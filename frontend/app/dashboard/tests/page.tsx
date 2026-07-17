import { PageHeader } from "@/components/PageHeader";
import { IconClipboardCheck, IconPlus } from "@tabler/icons-react";

export default function TestsPage() {
  return (
    <>
      <PageHeader 
        title="Tests" 
        subtitle="Upcoming tests and performance" 
        actionLabel="Schedule Test" 
        actionIcon={IconPlus} 
      />

      <div className="card p-8 text-center">
        <IconClipboardCheck size={48} className="mx-auto mb-6 text-lavender-dark" />
        <h3 className="text-xl font-semibold mb-2">No tests scheduled yet</h3>
        <p className="text-ink-secondary max-w-md mx-auto">
          Create mock tests or view upcoming assessments here.
        </p>
        <button className="btn-primary mt-6">Create New Test</button>
      </div>
    </>
  );
}