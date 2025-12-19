import Link from "next/link";
import Image from "next/image";

export function Logo() {
  return (
    <Link
      href="/"
      className="flex items-center gap-2 hover:opacity-90 transition-opacity"
    >
      <Image
        src="/favicon.svg"
        alt="StepSnip Logo"
        width={32}
        height={32}
        className="w-8 h-8"
        priority
      />
      <span className="font-bold text-lg bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
        StepSnip
      </span>
    </Link>
  );
}
