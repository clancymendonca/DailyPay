export default function AuthLoading() {
  return (
    <section className="auth-form animate-pulse">
      <div className="flex w-full max-w-[420px] flex-col gap-6">
        <div className="h-10 w-48 rounded-lg bg-gray-200" />
        <div className="h-4 w-64 rounded-lg bg-gray-100" />
        <div className="space-y-4">
          <div className="h-12 w-full rounded-lg bg-gray-100" />
          <div className="h-12 w-full rounded-lg bg-gray-100" />
          <div className="h-12 w-full rounded-lg bg-gray-200" />
        </div>
      </div>
    </section>
  );
}
