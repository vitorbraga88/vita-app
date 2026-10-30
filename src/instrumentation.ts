export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    // Node-only SQLite must not be loaded by the Edge instrumentation bundle.
    const { iniciarAgendador } = await import("./lib/agendador");
    iniciarAgendador();
  }
}
