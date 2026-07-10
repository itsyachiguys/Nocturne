import { Fragment } from "react";
import { PageHeader } from "@/components/PageHeader";
import { TIMETABLE, WEEK_DAYS } from "@/lib/academic-data";

const TIME_SLOTS = ["9:00", "10:00", "11:00", "13:00", "14:00"];

export default function TimetablePage() {
  return (
    <>
      <PageHeader title="Timetable" subtitle="Weekly view" />
      <div className="card overflow-x-auto p-5">
        <div className="grid min-w-[640px] grid-cols-[80px_repeat(5,1fr)] gap-2">
          <div />
          {WEEK_DAYS.map((day) => (
            <div key={day} className="pb-2 text-center text-xs font-bold text-ink-secondary dark:text-ink-secondary-dark">
              {day}
            </div>
          ))}
          {TIME_SLOTS.map((time) => (
            <Fragment key={time}>
              <div className="py-3 text-xs text-ink-muted dark:text-ink-muted-dark">
                {time}
              </div>
              {WEEK_DAYS.map((day) => {
                const slot = TIMETABLE.find((s) => s.day === day && s.time === time);
                return (
                  <div key={`${day}-${time}`} className="rounded-sm p-1.5">
                    {slot ? (
                      <div className="rounded-sm bg-lavender/10 px-2.5 py-2 text-[12px]">
                        <p className="font-semibold text-lavender-dark">{slot.subject}</p>
                        <p className="text-ink-muted dark:text-ink-muted-dark">{slot.room}</p>
                      </div>
                    ) : (
                      <div className="h-full rounded-sm border border-dashed border-line dark:border-line-dark" style={{ minHeight: "44px" }} />
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
