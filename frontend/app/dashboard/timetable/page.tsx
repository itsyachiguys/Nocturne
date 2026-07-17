import { Fragment } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TIMETABLE, WEEK_DAYS } from "@/lib/academic-data";

const TIME_SLOTS = ["9:00", "10:00", "11:00", "13:00", "14:00"];

export default function TimetablePage() {
  return (
    <>
      <PageHeader 
        title="Timetable" 
        subtitle="Weekly class schedule" 
      />

      <div className="card p-6 overflow-x-auto">
        <div className="grid min-w-[700px] grid-cols-[100px_repeat(5,1fr)] gap-3">
          
          {/* Header */}
          <div></div>
          {WEEK_DAYS.map((day) => (
            <div key={day} className="pb-4 text-center text-sm font-semibold text-ink-primary">
              {day}
            </div>
          ))}

          {/* Time Slots */}
          {TIME_SLOTS.map((time) => (
            <Fragment key={time}>
              <div className="py-4 text-right pr-4 text-sm font-medium text-ink-secondary dark:text-ink-secondary-dark border-r border-line dark:border-line-dark">
                {time}
              </div>

              {WEEK_DAYS.map((day) => {
                const slot = TIMETABLE.find((s) => s.day === day && s.time === time);
                return (
                  <div key={`${day}-${time}`} className="min-h-[68px] rounded-2xl p-3 transition-all">
                    {slot ? (
                      <div className="h-full rounded-2xl bg-lavender/10 p-3 border border-lavender/30">
                        <p className="font-semibold text-lavender-dark text-[14px]">{slot.subject}</p>
                        <p className="text-xs text-ink-secondary dark:text-ink-secondary-dark mt-1">
                          {slot.room}
                        </p>
                      </div>
                    ) : (
                      <div className="h-full rounded-2xl border border-dashed border-line dark:border-line-dark flex items-center justify-center">
                        <span className="text-xs text-ink-muted dark:text-ink-muted-dark">Free</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </Fragment>
          ))}
        </div>
      </div>
    </>
  );
}