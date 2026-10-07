import Image from "next/image";

/**
 * The Nocturne logo + name. Every dimension is fixed, so it renders at exactly
 * the same size wherever it is used. Reuse it on other pages (login, landing)
 * instead of re-creating the markup.
 */
export function BrandLogo() {
  return (
    <div className="flex w-full items-center gap-3">
      <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white shadow-md">
        <Image
          src="/Logo.png"
          alt="Nocturne Logo"
          width={48}
          height={48}
          priority
          className="h-full w-full object-cover"
        />
      </div>

      <div className="min-w-0">
        <p className="font-display whitespace-nowrap text-2xl font-extrabold leading-7 text-ink-primary dark:text-ink-primary-dark">
          Nocturne
        </p>
        <p className="whitespace-nowrap text-xs leading-4 text-ink-muted dark:text-ink-muted-dark">
          AI Learning Platform
        </p>
      </div>
    </div>
  );
}