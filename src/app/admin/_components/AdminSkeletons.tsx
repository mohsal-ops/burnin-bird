// Pulsing placeholder skeletons for admin loading states - the same "fading
// components" idea as the public site's loading.tsx, tailored per page. Plain
// server components (no client JS). The looping burger is overlaid on top by
// LoadingWithSkeleton.

function Header() {
  return (
    <div className="space-y-3">
      <div className="h-7 w-56 rounded-lg bg-gray-200" />
      <div className="h-4 w-72 max-w-[70%] rounded bg-gray-200" />
    </div>
  );
}

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="p-5 lg:px-16 lg:py-8">
    <div className="mx-auto w-full space-y-8 lg:w-[85%] animate-pulse">{children}</div>
  </div>
);

export function GenericSkeleton() {
  return (
    <Shell>
      <Header />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-200" />
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-40 rounded-2xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
    </Shell>
  );
}

export function TableSkeleton() {
  return (
    <Shell>
      <Header />
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-8 w-24 rounded-full bg-gray-200" />
        ))}
      </div>
      <div className="space-y-3">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
    </Shell>
  );
}

export function GridSkeleton() {
  return (
    <Shell>
      <Header />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-3">
            <div className="aspect-square rounded-2xl bg-gray-200" />
            <div className="h-4 w-3/4 rounded bg-gray-200" />
            <div className="h-3 w-1/2 rounded bg-gray-100" />
          </div>
        ))}
      </div>
    </Shell>
  );
}

export function ChartsSkeleton() {
  return (
    <Shell>
      <Header />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 rounded-2xl bg-gray-200" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl border border-gray-200 bg-gray-100" />
        ))}
      </div>
    </Shell>
  );
}
