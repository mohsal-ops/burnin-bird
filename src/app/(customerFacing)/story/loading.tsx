export default function Loading() {
  return (
    <main className="flex flex-col items-center pt-24 space-y-24 animate-pulse">

      {/* HERO SKELETON */}
      <section className="relative w-full h-[85vh] flex items-center justify-center bg-gray-200">
        <div className="text-center space-y-6 px-6">
          <div className="h-12 md:h-16 w-64 md:w-96 bg-gray-300 rounded-lg mx-auto" />
          <div className="h-5 md:h-6 w-80 md:w-lg bg-gray-300 rounded mx-auto" />
        </div>
      </section>

      {/* INTRO */}
      <section className="max-w-5xl px-6 text-center space-y-6">
        <div className="h-8 w-96 bg-gray-300 rounded mx-auto" />
        <div className="h-5 w-full max-w-3xl bg-gray-200 rounded mx-auto" />
        <div className="h-5 w-full max-w-2xl bg-gray-200 rounded mx-auto" />
      </section>

      {/* IMAGE + TEXT */}
      <section className="grid md:grid-cols-2 gap-12 max-w-6xl px-6 items-center w-full">
        <div className="w-full h-80 bg-gray-300 rounded-3xl" />
        <div className="space-y-4">
          <div className="h-6 w-64 bg-gray-300 rounded" />
          <div className="h-4 w-full bg-gray-200 rounded" />
          <div className="h-4 w-5/6 bg-gray-200 rounded" />
        </div>
      </section>

      {/* TIMELINE */}
      <section className="max-w-4xl px-6 w-full space-y-10">
        <div className="h-8 w-48 bg-gray-300 rounded mx-auto mb-8" />

        {[1, 2, 3].map((i) => (
          <div key={i} className="relative pl-8 space-y-2">
            <span className="absolute -left-2 top-1 w-4 h-4 bg-brand rounded-full" />
            <div className="h-4 w-20 bg-gray-300 rounded" />
            <div className="h-4 w-full bg-gray-200 rounded" />
          </div>
        ))}
      </section>

      {/* VALUES */}
      <section className="bg-gray-50 w-full py-20">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="h-8 w-64 bg-gray-300 rounded mx-auto mb-12" />

          <div className="grid sm:grid-cols-3 gap-8">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="bg-white rounded-2xl p-8 shadow-sm space-y-4"
              >
                <div className="h-5 w-32 bg-gray-300 rounded mx-auto" />
                <div className="h-4 w-full bg-gray-200 rounded" />
                <div className="h-4 w-5/6 bg-gray-200 rounded mx-auto" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL IMAGE */}
      <section className="max-w-6xl px-6 w-full">
        <div className="w-full h-96 bg-gray-300 rounded-3xl" />
      </section>

      {/* CLOSING */}
      <section className="max-w-3xl px-6 text-center pb-24 space-y-4">
        <div className="h-8 w-72 bg-gray-300 rounded mx-auto" />
        <div className="h-5 w-full bg-gray-200 rounded" />
        <div className="h-5 w-5/6 bg-gray-200 rounded mx-auto" />
      </section>

    </main>
  );
}
