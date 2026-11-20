export default function Loading() {
  return (
    <div className="animate-pulse space-y-5" aria-busy aria-label="Cargando">
      <div className="bg-border/60 h-12 w-80 rounded-lg" />
      <div className="bg-border/60 h-16 rounded-xl" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div key={index} className="bg-border/60 h-24 rounded-xl" />
        ))}
      </div>
      <div className="bg-border/60 h-48 rounded-xl" />
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="bg-border/60 h-80 rounded-xl lg:col-span-2" />
        <div className="bg-border/60 h-80 rounded-xl" />
      </div>
    </div>
  );
}
