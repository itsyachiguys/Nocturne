import Image from "next/image";
import Link from "next/link";

interface LogoProps {
  size?: number;
  showText?: boolean;
}

export default function Logo({
  size = 56,
  showText = true,
}: LogoProps) {
  return (
    <Link
      href="/"
      className="flex items-center gap-3 select-none"
    >
      <div
        className="relative overflow-hidden rounded-full shadow-md border border-violet-200 bg-white"
        style={{
          width: `${size}px`,
          height: `${size}px`,
        }}
      >
        <Image
          src="/logo.png" // put your logo inside frontend/public/logo.png
          alt="Nocturne Logo"
          fill
          priority
          className="object-cover"
        />
      </div>

      {showText && (
        <div>
          <h1 className="text-xl font-bold tracking-tight text-violet-700">
            Nocturne
          </h1>

          <p className="text-xs text-slate-500">
            AI Powered Student Platform
          </p>
        </div>
      )}
    </Link>
  );
}