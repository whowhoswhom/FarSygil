import { redirect } from "next/navigation";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function ActivityDetailRedirectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ id }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const nextSearchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(resolvedSearchParams)) {
    if (typeof value === "string") {
      nextSearchParams.set(key, value);
    } else if (Array.isArray(value)) {
      for (const entry of value) {
        nextSearchParams.append(key, entry);
      }
    }
  }

  const search = nextSearchParams.toString();

  redirect(search ? `/runs/${id}?${search}` : `/runs/${id}`);
}

