export default function HomePage() {
  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto flex min-h-screen max-w-md flex-col">
        <header className="border-b p-4">
          <h1 className="text-xl font-semibold">Sticker Map</h1>
          <p className="text-sm text-neutral-600">
            Mappa delle foto con posizione GPS e stato sticker
          </p>
        </header>

        <section className="flex-1 p-4">
          <div className="rounded-2xl border border-dashed p-6 text-center">
            <p className="font-medium">Qui arriverà la mappa</p>
            <p className="mt-2 text-sm text-neutral-600">
              Poi aggiungeremo upload foto, marker e dettagli.
            </p>
          </div>
        </section>

        <footer className="border-t p-4 text-xs text-neutral-500">
          MVP v1
        </footer>
      </div>
    </main>
  );
}