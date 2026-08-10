export default function BlogLoading() {
  return (
    <div className="min-h-screen w-full bg-[#0f0f0f] text-white animate-pulse">
      
      {/* HERO SKELETON */}
      <section className="relative h-[80vh] flex items-end overflow-hidden">
        <div className="absolute inset-0 bg-[#1a1a1a]" />
        <div className="absolute inset-0 bg-linear-to-t from-black via-black/70 to-transparent" />

        <div className="relative z-10 p-10 max-w-4xl space-y-4">
          <div className="h-4 w-32 bg-[#f4b400]/40 rounded" />

          <div className="h-14 w-[90%] bg-gray-700 rounded" />
          <div className="h-14 w-[70%] bg-gray-700 rounded" />

          <div className="h-5 w-full bg-gray-600 rounded mt-4" />
          <div className="h-5 w-[85%] bg-gray-600 rounded" />

          <div className="h-12 w-40 bg-[#f4b400]/60 rounded-full mt-6" />
        </div>
      </section>

      {/* GRID SKELETON */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="h-8 w-72 bg-gray-700 rounded mb-10" />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl overflow-hidden bg-[#161616]"
            >
              <div className="h-60 bg-gray-700" />
              <div className="p-5 space-y-3">
                <div className="h-6 w-[80%] bg-gray-600 rounded" />
                <div className="h-4 w-full bg-gray-700 rounded" />
                <div className="h-4 w-[90%] bg-gray-700 rounded" />
                <div className="h-4 w-[40%] bg-[#f4b400]/50 rounded mt-4" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* BRAND STRIP PLACEHOLDER */}
      <section className="bg-[#f4b400] py-20 text-center">
        <div className="h-10 w-[60%] bg-black/20 mx-auto rounded" />
        <div className="h-5 w-[70%] bg-black/20 mx-auto rounded mt-4" />
      </section>
    </div>
  );
}
