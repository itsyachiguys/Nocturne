import { PageHeader } from "@/components/PageHeader";

const NOTIFICATION_TOGGLES = [
  { label: "Assignment reminders", enabled: true },
  { label: "Attendance alerts", enabled: true },
  { label: "AI note generation complete", enabled: true },
  { label: "Weekly progress summary", enabled: false },
  { label: "Leaderboard updates", enabled: true },
];

function Toggle({ enabled }: { enabled: boolean }) {
  return (
    <div
      className={`flex h-6 w-11 items-center rounded-full p-0.5 transition-all duration-200 cursor-pointer ${
        enabled 
          ? "bg-brand-gradient justify-end" 
          : "bg-surface-alt justify-start dark:bg-surface-alt-dark"
      }`}
    >
      <div className="h-5 w-5 rounded-full bg-white shadow-soft transition-transform" />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <>
      <PageHeader 
        title="Settings" 
        subtitle="Manage your account preferences and security"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        
        {/* Appearance */}
        <div className="card p-6">
          <h4 className="mb-5 text-[15px] font-semibold text-ink-primary">Appearance</h4>
          <p className="mb-3 text-xs text-ink-secondary dark:text-ink-secondary-dark">Theme</p>
          <div className="flex gap-2">
            {["Light", "Dark", "System"].map((mode, i) => (
              <button
                key={mode}
                className={`flex-1 rounded-xl border px-4 py-3 text-sm font-medium transition-all ${
                  i === 1
                    ? "border-lavender-dark bg-lavender/10 text-lavender-dark shadow-sm"
                    : "border-line hover:border-lavender/30 text-ink-secondary dark:border-line-dark dark:text-ink-secondary-dark"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <h4 className="mb-5 text-[15px] font-semibold text-ink-primary">Notifications</h4>
          <div className="flex flex-col gap-4">
            {NOTIFICATION_TOGGLES.map((n, idx) => (
              <div key={idx} className="flex items-center justify-between py-1">
                <span className="text-sm text-ink-primary">{n.label}</span>
                <Toggle enabled={n.enabled} />
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div className="card p-6 lg:col-span-2">
          <h4 className="mb-5 text-[15px] font-semibold text-ink-primary">Account Information</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                Full Name
              </label>
              <input 
                defaultValue="Aria Fernandes" 
                className="w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:outline-none focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark" 
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-secondary mb-1.5">
                Email Address
              </label>
              <input 
                defaultValue="aria.fernandes@nocturne.edu" 
                className="w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:outline-none focus:border-lavender dark:border-line-dark dark:bg-surface-bg-dark" 
              />
            </div>
          </div>
          <button className="btn-primary mt-6">Save Changes</button>
        </div>

        {/* Security */}
        <div className="card p-6">
          <h4 className="mb-5 text-[15px] font-semibold text-ink-primary">Security</h4>
          <div className="flex flex-col gap-3">
            <button className="btn-ghost w-full justify-start px-4 py-3 text-left text-sm hover:bg-lavender/5">
              Change Password
            </button>
            <button className="btn-ghost w-full justify-start px-4 py-3 text-left text-sm hover:bg-lavender/5">
              Manage Connected Devices
            </button>
            <button className="btn-ghost w-full justify-start px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30">
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </>
  );
}