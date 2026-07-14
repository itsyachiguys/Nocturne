import Image from "next/image";

interface LogoProps {
  /** Show the "Nocturne" wordmark next to the mark. Default true. */
  showText?: boolean;
  /** Pixel size of the logo mark (square). Default 32. */
  size?: number;
}

export function Logo({ showText = true, size = 32 }: LogoProps) {
  return (
    <div className="flex items-center gap-2 font-display text-xl font-extrabold">
      <Image
        src="/logo.png"
        alt="Nocturne"
        width={size}
        height={size}
        className="rounded-full object-cover"
        priority
      />
      {showText && "Nocturne"}
    </div>
  );
}
