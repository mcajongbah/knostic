import CSVManager from "./pages/CSVManager";

function App() {
  return (
    <div className="min-h-screen bg-gray-50 text-slate-900">
      <header className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <div className="mx-auto max-w-[95%] px-4 py-10 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
            CSV Management System
          </h1>
          <p className="mt-2 text-sm/6 text-indigo-100">
            Upload, edit, validate, and export your strings and classifications
            CSVs
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-[95%] px-4 py-8 sm:px-6 lg:px-8">
        <CSVManager />
      </main>
    </div>
  );
}

export default App;
