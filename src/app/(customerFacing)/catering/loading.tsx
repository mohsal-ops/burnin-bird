
export default function LoadingCatering() {
  return (
    <div className="flex flex-col items-center md:w-[90vw] pt-20 p-2 space-y-16 animate-pulse">
      {/* Hero Skeleton */}
      <section className="relative w-full  rounded-2xl p-4 flex flex-col md:flex-row items-center gap-10">
        <div className="md:w-1/2 h-64 md:h-96 rounded-2xl bg-black/10" />

        <div className="md:w-1/2 space-y-4 w-full">
          <div className="h-10 md:h-14 w-3/4 bg-black/10 rounded-lg" />
          <div className="h-5 w-full bg-black/10 rounded-md" />
          <div className="h-5 w-5/6 bg-black/10 rounded-md" />

          <div className="flex gap-4 mt-6">
            <div className="h-12 w-40 rounded-xl bg-black/10" />
            <div className="h-12 w-32 rounded-xl bg-black/10" />
          </div>
        </div>
      </section>

      {/* Why Choose Us Skeleton */}
      <section className="max-w-6xl w-full space-y-10 text-center">
        <div className="h-8 w-72 mx-auto bg-gray-200 rounded-lg" />

        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl shadow-md bg-white p-6 space-y-3"
            >
              <div className="h-5 w-2/3 bg-gray-200 rounded-md" />
              <div className="h-4 w-full bg-gray-200 rounded-md" />
              <div className="h-4 w-5/6 bg-gray-200 rounded-md" />
            </div>
          ))}
        </div>
      </section>

      {/* Menu Skeleton */}
      <section className="max-w-6xl w-full space-y-10 px-2">
        <div className="flex justify-between items-center">
          <div className="h-8 w-56 bg-gray-200 rounded-lg" />
          <div className="h-10 w-40 bg-gray-200 rounded-lg" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl border p-4 space-y-4"
            >
              <div className="h-40 bg-gray-200 rounded-xl" />
              <div className="h-5 w-3/4 bg-gray-200 rounded-md" />
              <div className="h-4 w-full bg-gray-200 rounded-md" />
              <div className="h-10 w-32 bg-gray-200 rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

