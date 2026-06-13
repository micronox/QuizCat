import Link from "next/link";
import QuestionLab from "@/components/QuestionLab";
import BrandLogo from "@/components/BrandLogo";

export default function QuestionLabPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-4xl flex-col gap-6 px-6 py-12">
      <header>
        <BrandLogo priority />
        <Link href="/" className="text-sm text-emerald-600 hover:underline">
          <span className="mt-4 inline-block">Back to dashboard</span>
        </Link>
        <h1 className="mt-3 text-3xl font-bold tracking-tight">Question Lab</h1>
        <p className="mt-1 text-sm text-zinc-500">
          An LLM creates candidates. The harness decides whether they pass.
        </p>
      </header>
      <QuestionLab />
    </main>
  );
}
