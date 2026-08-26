
export default function LoadingCatering() {
  return (
    <div className="flex flex-col items-center md:w-[90vw] pt-20 p-2 space-y-16 animate-pulse">
      {/* Hero Skeleton */}
      <section className="relative w-full  rounded-2xl p-4 flex flex-col md:flex-row items-center gap-10">
        <div className="md:w-1/2 h-64 md:h-96 rounded-2xl bg-muted" />

        <div className="md:w-1/2 space-y-4 w-full">
          <div className="h-10 md:h-14 w-3/4 bg-muted rounded-lg" />
          <div className="h-5 w-full bg-muted rounded-md" />
          <div className="h-5 w-5/6 bg-muted rounded-md" />

          <div className="flex gap-4 mt-6">
            <div className="h-12 w-40 rounded-xl bg-muted" />
            <div className="h-12 w-32 rounded-xl bg-muted" />
          </div>
        </div>
      </section>

      {/* Why Choose Us Skeleton */}
      <section className="max-w-6xl w-full space-y-10 text-center">
        <div className="h-8 w-72 mx-auto bg-muted rounded-lg" />

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl shadow-md bg-card p-6 space-y-3"
            >
              <div className="h-5 w-2/3 bg-muted rounded-md" />
              <div className="h-4 w-full bg-muted rounded-md" />
              <div className="h-4 w-5/6 bg-muted rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* Menu Skeleton */}
      <section className="max-w-6xl w-full space-y-10 px-2">
        <div className="flex justify-between items-center">
          <div className="h-8 w-56 bg-muted rounded-lg" />
          <div className="h-10 w-40 bg-muted rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border p-4 space-y-4"
            >
              <div className="h-40 bg-muted rounded-xl" />
              <div className="h-5 w-3/4 bg-muted rounded-md" />
              <div className="h-4 w-full bg-muted rounded-md" />
              <div className="h-10 w-32 bg-muted rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

