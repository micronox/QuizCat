import Image from "next/image";
import Link from "next/link";

export default function BrandLogo({ priority = false }: { priority?: boolean }) {
  return (
    <Link
      href="/"
      aria-label="CCat Leash Harness home"
      className="block overflow-hidden rounded-lg border border-zinc-200 bg-white p-3 shadow-sm transition hover:border-emerald-400 dark:border-zinc-700 dark:bg-black"
    >
      <Image
        src="/brand/ccat-leash-harness.png"
        alt="CCat Leash Harness. If I Fits, I Harness Sits. Blace Houle and Larry Vallely."
        width={1452}
        height={343}
        priority={priority}
        className="h-auto w-full dark:invert"
      />
    </Link>
  );
}
