"use client";

import { useEffect, useState } from "react";
import {
  IconCheck,
  IconDeviceFloppy,
} from "@tabler/icons-react";

import { PageHeader } from "@/components/PageHeader";
import { UserService } from "@/services/user.service";
import { useAuth } from "@/context/AuthContext";

type ThemeMode = "light" | "dark" | "system";

interface NotificationPreferences {
  assignmentReminders: boolean;
  attendanceAlerts: boolean;
  aiNoteGeneration: boolean;
  weeklyProgressSummary: boolean;
  leaderboardUpdates: boolean;
}

const DEFAULT_NOTIFICATIONS: NotificationPreferences = {
  assignmentReminders: true,
  attendanceAlerts: true,
  aiNoteGeneration: true,
  weeklyProgressSummary: false,
  leaderboardUpdates: true,
};

const NOTIFICATION_TOGGLES = [
  {
    key: "assignmentReminders",
    label: "Assignment reminders",
  },
  {
    key: "attendanceAlerts",
    label: "Attendance alerts",
  },
  {
    key: "aiNoteGeneration",
    label: "AI note generation complete",
  },
  {
    key: "weeklyProgressSummary",
    label: "Weekly progress summary",
  },
  {
    key: "leaderboardUpdates",
    label: "Leaderboard updates",
  },
] as const;

function Toggle({
  enabled,
  onClick,
}: {
  enabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={enabled}
      className={
        enabled
          ? "flex h-6 w-11 items-center justify-end rounded-full bg-brand-gradient p-0.5 transition-all duration-200"
          : "flex h-6 w-11 items-center justify-start rounded-full bg-surface-alt p-0.5 transition-all duration-200 dark:bg-surface-alt-dark"
      }
    >
      <div className="h-5 w-5 rounded-full bg-white shadow-soft transition-transform" />
    </button>
  );
}

export default function SettingsPage() {
  const { user, loading: authLoading } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const [theme, setTheme] =
    useState<ThemeMode>("system");

  const [notifications, setNotifications] =
    useState<NotificationPreferences>(
      DEFAULT_NOTIFICATIONS
    );

  const [savingProfile, setSavingProfile] =
    useState(false);

  const [profileMessage, setProfileMessage] =
    useState("");

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) {
      return;
    }

    if (!user) {
      setLoading(false);
      return;
    }

    const currentUser = user;

    async function loadSettings() {
      try {
        const profile =
          await UserService.getProfile(
            currentUser.uid
          );

        setName(
          profile?.name ??
            currentUser.displayName ??
            ""
        );

        setEmail(
          profile?.email ??
            currentUser.email ??
            ""
        );

        const savedNotifications =
          localStorage.getItem(
            `nocturne-notifications-${currentUser.uid}`
          );

        if (savedNotifications) {
          try {
            const parsed =
              JSON.parse(savedNotifications);

            setNotifications({
              ...DEFAULT_NOTIFICATIONS,
              ...parsed,
            });
          } catch {
            setNotifications(
              DEFAULT_NOTIFICATIONS
            );
          }
        }

        const savedTheme =
          localStorage.getItem(
            `nocturne-theme-${currentUser.uid}`
          );

        if (
          savedTheme === "light" ||
          savedTheme === "dark" ||
          savedTheme === "system"
        ) {
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error(
          "Failed to load settings:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadSettings();
  }, [authLoading, user]);

  function handleThemeChange(
    newTheme: ThemeMode
  ) {
    setTheme(newTheme);

    if (!user) {
      return;
    }

    localStorage.setItem(
      `nocturne-theme-${user.uid}`,
      newTheme
    );

    const root = document.documentElement;

    if (newTheme === "dark") {
      root.classList.add("dark");
      return;
    }

    if (newTheme === "light") {
      root.classList.remove("dark");
      return;
    }

    const prefersDark =
      window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;

    root.classList.toggle(
      "dark",
      prefersDark
    );
  }

  function handleNotificationToggle(
    key: keyof NotificationPreferences
  ) {
    if (!user) {
      return;
    }

    setNotifications((previous) => {
      const updated: NotificationPreferences = {
        ...previous,
        [key]: !previous[key],
      };

      localStorage.setItem(
        `nocturne-notifications-${user.uid}`,
        JSON.stringify(updated)
      );

      return updated;
    });
  }

  async function handleSaveProfile() {
    if (!user) {
      return;
    }

    setSavingProfile(true);
    setProfileMessage("");

    try {
      await UserService.updateProfile(
        user.uid,
        {
          name: name.trim(),
        }
      );

      setProfileMessage(
        "Account information saved."
      );
    } catch (error) {
      console.error(
        "Failed to save account information:",
        error
      );

      setProfileMessage(
        "Failed to save changes. Please try again."
      );
    } finally {
      setSavingProfile(false);
    }
  }

  if (authLoading || loading) {
    return (
      <>
        <PageHeader
          title="Settings"
          subtitle="Manage your account preferences and security"
        />

        <div className="card p-8">
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
            Loading settings...
          </p>
        </div>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <PageHeader
          title="Settings"
          subtitle="Manage your account preferences and security"
        />

        <div className="card p-8">
          <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
            Please log in to manage your settings.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <PageHeader
        title="Settings"
        subtitle="Manage your account preferences and security"
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">

        {/* Appearance */}
        <div className="card p-6">
          <h4 className="mb-5 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
            Appearance
          </h4>

          <p className="mb-3 text-xs text-ink-secondary dark:text-ink-secondary-dark">
            Theme
          </p>

          <div className="flex gap-2">
            {(
              ["light", "dark", "system"] as ThemeMode[]
            ).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() =>
                  handleThemeChange(mode)
                }
                className={
                  theme === mode
                    ? "flex-1 rounded-xl border border-lavender-dark bg-lavender/10 px-4 py-3 text-sm font-medium capitalize text-lavender-dark shadow-sm transition-all"
                    : "flex-1 rounded-xl border border-line px-4 py-3 text-sm font-medium capitalize text-ink-secondary dark:text-ink-secondary-dark transition-all hover:border-lavender/30 dark:border-line-dark"
                }
              >
                {theme === mode && (
                  <IconCheck
                    size={15}
                    className="mr-1 inline"
                  />
                )}

                {mode}
              </button>
            ))}
          </div>
        </div>

        {/* Notifications */}
        <div className="card p-6">
          <h4 className="mb-5 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
            Notifications
          </h4>

          <div className="flex flex-col gap-4">
            {NOTIFICATION_TOGGLES.map(
              (notification) => (
                <div
                  key={notification.key}
                  className="flex items-center justify-between py-1"
                >
                  <span className="text-sm text-ink-primary dark:text-ink-primary-dark">
                    {notification.label}
                  </span>

                  <Toggle
                    enabled={
                      notifications[
                        notification.key
                      ]
                    }
                    onClick={() =>
                      handleNotificationToggle(
                        notification.key
                      )
                    }
                  />
                </div>
              )
            )}
          </div>
        </div>

        {/* Account Information */}
        <div className="card p-6 lg:col-span-2">
          <h4 className="mb-5 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
            Account Information
          </h4>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">

            <div>
              <label
                htmlFor="settings-name"
                className="mb-1.5 block text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark"
              >
                Full Name
              </label>

              <input
                id="settings-name"
                type="text"
                value={name}
                onChange={(e) =>
                  setName(e.target.value)
                }
                className="w-full rounded-2xl border border-line bg-surface-bg px-4 py-3 text-sm focus:border-lavender focus:outline-none dark:border-line-dark dark:bg-surface-bg-dark"
              />
            </div>

            <div>
              <label
                htmlFor="settings-email"
                className="mb-1.5 block text-xs font-semibold text-ink-secondary dark:text-ink-secondary-dark"
              >
                Email Address
              </label>

              <input
                id="settings-email"
                type="email"
                value={email}
                disabled
                className="w-full cursor-not-allowed rounded-2xl border border-line bg-surface-alt px-4 py-3 text-sm text-ink-secondary dark:text-ink-secondary-dark focus:outline-none dark:border-line-dark dark:bg-surface-alt-dark"
              />

              <p className="mt-2 text-xs text-ink-secondary dark:text-ink-secondary-dark">
                Email is managed by your authentication provider.
              </p>
            </div>

          </div>

          <div className="mt-6 flex items-center gap-4">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="btn-primary flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <IconDeviceFloppy size={17} />

              {savingProfile
                ? "Saving..."
                : "Save Changes"}
            </button>

            {profileMessage && (
              <p className="text-sm text-ink-secondary dark:text-ink-secondary-dark">
                {profileMessage}
              </p>
            )}
          </div>
        </div>

        {/* Security */}
        <div className="card p-6">
          <h4 className="mb-5 text-[15px] font-semibold text-ink-primary dark:text-ink-primary-dark">
            Security
          </h4>

          <div className="flex flex-col gap-3">

            <button
              type="button"
              className="btn-ghost w-full justify-start px-4 py-3 text-left text-sm hover:bg-lavender/5"
            >
              Change Password
            </button>

            <button
              type="button"
              className="btn-ghost w-full justify-start px-4 py-3 text-left text-sm hover:bg-lavender/5"
            >
              Manage Connected Devices
            </button>

            <button
              type="button"
              className="btn-ghost w-full justify-start px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              Delete Account
            </button>

          </div>
        </div>

      </div>
    </>
  );
}