export default function RootLoading() {
  return (
    <section className="home animate-pulse">
      <div className="home-content">
        <header className="home-header">
          <div className="flex flex-col gap-2">
            <div className="h-8 w-48 rounded-lg bg-gray-200" />
            <div className="h-4 w-72 rounded-lg bg-gray-100" />
          </div>
          <div className="h-32 w-full rounded-xl bg-gray-200" />
        </header>
        <div className="mt-8 space-y-4">
          <div className="h-6 w-40 rounded-lg bg-gray-200" />
          <div className="h-64 w-full rounded-xl bg-gray-100" />
        </div>
      </div>
      <aside className="right-sidebar hidden xl:block">
        <div className="h-48 w-full rounded-xl bg-gray-200" />
        <div className="mt-6 h-32 w-full rounded-xl bg-gray-100" />
      </aside>
    </section>
  );
}
