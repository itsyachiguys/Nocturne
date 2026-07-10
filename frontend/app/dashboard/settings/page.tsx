import { PageHeader } from "@/components/PageHeader";

const NOTIFICATION_TOGGLES = [
  { label: "Assignment reminders", enabled: true },
  { label: "Attendance alerts", enabled: true },
  { label: "AI note generation complete", enabled: true },
  { label: "Weekly progress summary", enabled: false },
];

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-colors ${
        enabled ? "bg-brand-gradient justify-end" : "bg-surface-alt justify-start dark:bg-surface-alt-dark"
      }`}
    >
      <div className="h-5 w-5 rounded-full bg-white shadow-soft" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader title="Settings" />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h4 className="mb-4 text-[14.5px]">Appearance</h4>
          <p className="mb-3 text-xs text-ink-secondary dark:text-ink-secondary-dark">Theme</p>
          <div className="flex gap-2">
            {["Light", "Dark", "System"].map((mode, i) => (
              <button
                key={mode}
                className={`flex-1 rounded-sm border px-3 py-2 text-xs font-semibold ${
                  i === 2
                    ? "border-lavender-dark bg-lavender/10 text-lavender-dark"
                    : "border-line text-ink-secondary dark:border-line-dark dark:text-ink-secondary-dark"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h4 className="mb-4 text-[14.5px]">Notifications</h4>
          <div className="flex flex-col gap-3.5">
            {NOTIFICATION_TOGGLES.map((n) => (
              <div key={n.label} className="flex items-center justify-between text-sm">
                <span>{n.label}</span>
                <Toggle enabled={n.enabled} />
              </div>
            ))}
          </div>
        </div>

        <div className="card p-5">
          <h4 className="mb-4 text-[14.5px]">Account</h4>
          <div className="flex flex-col gap-3 text-sm">
            <label className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">
              Full name
              <input defaultValue="Aria Fernandes" className="mt-1 w-full rounded-sm border border-line bg-surface-bg px-3 py-2 dark:border-line-dark dark:bg-surface-bg-dark" />
            </label>
            <label className="text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark">
              Email
              <input defaultValue="aria.fernandes@nocturne.edu" className="mt-1 w-full rounded-sm border border-line bg-surface-bg px-3 py-2 dark:border-line-dark dark:bg-surface-bg-dark" />
            </label>
            <button className="btn-primary mt-1 w-fit">Save changes</button>
          </div>
        </div>

        <div className="card p-5">
          <h4 className="mb-4 text-[14.5px]">Security</h4>
          <div className="flex flex-col gap-3">
            <button className="btn-ghost w-fit px-4 py-2 text-xs">Change password</button>
            <button className="btn-ghost w-fit px-4 py-2 text-xs">Manage connected devices</button>
          </div>
        </div>
      </div>
    </>
  );
}
