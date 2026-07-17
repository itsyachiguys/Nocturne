import { PageHeader } from "@/components/PageHeader";
import { IconCalendar } from "@tabler/icons-react";

export default function CalendarPage() {
  return (
    <>
      <PageHeader 
        title="Calendar" 
        subtitle="Academic events & deadlines" 
      />

      <div className="card p-8">
        <div className="flex items-center justify-center h-64 text-center">
          <div>
            <IconCalendar size={48} className="mx-auto mb-6 text-lavender-dark" />
            <h3 className="text-xl font-semibold mb-2">Monthly Calendar View</h3>
            <p className="text-ink-secondary max-w-md mx-auto">
              Upcoming deadlines, exams, and events will appear here.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}