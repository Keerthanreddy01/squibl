"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { getAllProjects } from "@/lib/projects";
import { ArrowUpRight, Rocket, Search, Sparkles } from "lucide-react";

import { ProjectCard } from "@/components/projects/project-card";
import { ShipProjectDialog } from "@/components/projects/ship-project-dialog";
import { cn } from "@/lib/utils";

type Project = {
  id?: string;
  name?: string;
  description?: string;
  tech_stack?: string[] | string;
  uid?: string;
  created_at?: string;
  demo_url?: string;
  github_url?: string;
  author_name?: string;
};

const filterOptions = ["All", "React", "Next.js", "Supabase", "TypeScript", "PostgreSQL", "Tailwind"];

function normalizeStack(stack: Project["tech_stack"]) {
  if (Array.isArray(stack)) {
    return stack.map((entry) => entry.trim()).filter(Boolean);
  }

  if (typeof stack === "string") {
    return stack
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return [];
}

function formatDate(value?: string) {
  if (!value) return "Recently";

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "Recently";

  return parsed.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function hashString(value: string) {
  let hash = 0;

  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

export default function ProjectsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    const loadProjects = async () => {
      try {
        const { data, error } = await getAllProjects();
        if (!error && data) {
          setProjects(data as Project[]);
        }
      } catch (err) {
        console.error("Failed to load projects:", err);
      } finally {
        setLoading(false);
      }
    };
    loadProjects();
  }, []);

  const filteredProjects = useMemo(() => {
    const query = search.trim().toLowerCase();
    return projects.filter((project) => {
      const stack = normalizeStack(project.tech_stack);
      const matchesFilter =
        activeFilter === "All" ||
        stack.some((tech) => tech.toLowerCase().includes(activeFilter.toLowerCase()));

      if (!matchesFilter) return false;
      if (!query) return true;

      const tech = stack.join(" ");
      const haystack = [
        project.name ?? "",
        project.description ?? "",
        tech,
        project.author_name ?? ""
      ].join(" ").toLowerCase();
      return haystack.includes(query);
    });
  }, [activeFilter, projects, search]);

  if (authLoading || !user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#E5EEFF] dark:bg-[#070712]">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7A5BFF] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#f7f5f2] text-slate-900 antialiased dark:bg-[#070712] dark:text-white">
      {/* Background decorations matching the first screenshot exactly */}
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.08),transparent_28%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.06),transparent_24%),radial-gradient(circle_at_bottom,rgba(255,255,255,0.65),transparent_52%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(168,85,247,0.24),transparent_26%),radial-gradient(circle_at_top_right,rgba(236,72,153,0.18),transparent_22%),radial-gradient(circle_at_bottom,rgba(15,23,42,0.95),transparent_55%)]" />
      <div className="pointer-events-none fixed inset-0 bg-[linear-gradient(rgba(15,23,42,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.03)_1px,transparent_1px)] bg-[size:28px_28px] opacity-20 dark:bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] dark:opacity-25" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        
        {/* Beautiful white header card from the first screenshot */}
        <header className="rounded-[32px] border border-slate-200/80 bg-white/90 px-5 py-5 shadow-[0_18px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5 dark:shadow-[0_18px_50px_rgba(0,0,0,0.22)] sm:px-7 sm:py-6">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-3xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500 shadow-sm dark:border-white/10 dark:bg-white/5 dark:text-white/70">
                <Sparkles className="size-3.5 text-fuchsia-500" />
                Builder marketplace
              </div>
              <h1 className="max-w-2xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl lg:text-6xl">
                Shipped Projects
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-500 dark:text-white/70 sm:text-base">
                Browse innovative products shipped by builders
              </p>
            </div>

            <ShipProjectDialog
              trigger={
                <button type="button" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 px-5 py-3 text-sm font-semibold text-black dark:text-white shadow-[0_18px_35px_rgba(168,85,247,0.34)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_45px_rgba(236,72,153,0.38)]">
                  <ArrowUpRight className="size-4" />
                  + Ship Yours
                </button>
              }
            />
          </div>

          <div className="mt-6 flex items-center gap-3 rounded-[24px] border border-slate-200 bg-white px-4 py-3 shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-black/20 dark:shadow-inner dark:shadow-black/10">
            <Search className="size-4 text-slate-400 dark:text-white/45" />
            <input
              type="text"
              placeholder="Search by name, stack, or builder..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full bg-transparent text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none dark:text-white dark:placeholder:text-black dark:text-white/35"
            />
          </div>

          <div className="mt-5 -mx-1 overflow-x-auto pb-1">
            <div className="flex min-w-max items-center gap-2 px-1">
              {filterOptions.map((option) => {
                const active = activeFilter === option;
                return (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setActiveFilter(option)}
                    className={cn(
                      'rounded-full border px-4 py-2 text-sm font-semibold transition',
                      active
                        ? 'border-transparent bg-slate-950 text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] dark:bg-white dark:text-slate-950'
                        : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:border-white/10 dark:bg-white/5 dark:text-white/75 dark:hover:bg-black/10 dark:bg-white/10 dark:hover:text-black dark:text-white',
                    )}
                  >
                    {option}
                  </button>
                )
              })}
            </div>
          </div>
        </header>

        {/* FEED SECTION */}
        <section className="mt-8">
          {loading ? (
            <div className="grid gap-5 lg:grid-cols-3 md:grid-cols-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={`skeleton-${index}`}
                  className="animate-pulse rounded-[28px] border border-slate-200 bg-white p-4 shadow-[0_12px_30px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/5"
                >
                  <div className="h-36 rounded-[22px] bg-gradient-to-br from-violet-400/30 via-fuchsia-400/30 to-orange-300/30" />
                  <div className="mt-4 space-y-3">
                    <div className="h-7 w-2/3 rounded-full bg-slate-200 dark:bg-white/10" />
                    <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-white/8" />
                    <div className="h-4 w-5/6 rounded-full bg-slate-100 dark:bg-white/8" />
                    <div className="flex gap-2 pt-2">
                      <div className="h-7 w-20 rounded-full bg-slate-200 dark:bg-white/10" />
                      <div className="h-7 w-24 rounded-full bg-slate-200 dark:bg-white/10" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : projects.length === 0 ? (
            <div className="mx-auto mt-4 max-w-2xl rounded-[32px] border border-slate-200 bg-white/90 px-6 py-14 text-center shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_16px_50px_rgba(0,0,0,0.22)]">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-gradient-to-br from-violet-500/20 via-fuchsia-500/20 to-pink-500/20 ring-1 ring-slate-200 dark:ring-white/10">
                <Rocket className="size-9 animate-bounce text-fuchsia-500 dark:text-fuchsia-300" />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                No projects yet. Be the first to ship!
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-white/65">
                Drop the first build, add your stack, and start the kind of project thread builders want to join.
              </p>
              <div className="mt-8 flex justify-center">
                <ShipProjectDialog
                  trigger={
                    <button type="button" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-violet-600 via-fuchsia-500 to-pink-500 px-5 py-3 text-sm font-semibold text-black dark:text-white shadow-[0_18px_35px_rgba(168,85,247,0.34)] transition hover:-translate-y-0.5">
                      <ArrowUpRight className="size-4" />
                      + Ship Yours
                    </button>
                  }
                />
              </div>
            </div>
          ) : filteredProjects.length === 0 ? (
            <div className="mx-auto mt-4 max-w-2xl rounded-[32px] border border-slate-200 bg-white/90 px-6 py-14 text-center shadow-[0_16px_50px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/6 dark:shadow-[0_16px_50px_rgba(0,0,0,0.22)]">
              <div className="mx-auto flex size-20 items-center justify-center rounded-full bg-slate-100 ring-1 ring-slate-200 dark:bg-white/5 dark:ring-white/10">
                <Search className="size-8 text-slate-500 dark:text-white/55" />
              </div>
              <h2 className="mt-6 text-2xl font-black tracking-tight text-slate-950 dark:text-white">
                No matches for that search.
              </h2>
              <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-slate-500 dark:text-white/65">
                Try a different stack, project name, or builder. The feed is filtering live.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 lg:grid-cols-3 md:grid-cols-2">
              {filteredProjects.map((project) => {
                const stack = normalizeStack(project.tech_stack);
                const builder = project.author_name || "Anonymous Builder";
                const title = project.name || "Untitled Project";

                return (
                  <ProjectCard
                    key={project.id}
                    title={title}
                    description={project.description || "A shipped build from the Squibl community."}
                    stack={stack}
                    builder={builder}
                    date={formatDate(project.created_at)}
                    upvotes={Math.max(7, (hashString(title) % 120) + stack.length * 3)}
                    liveUrl={project.demo_url}
                    githubUrl={project.github_url}
                  />
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
