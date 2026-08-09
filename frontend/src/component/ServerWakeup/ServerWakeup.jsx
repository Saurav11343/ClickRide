const messages = {
  connecting: {
    title: "Starting ClickRide",
    detail: "Our server is waking up. This usually takes 30–60 seconds.",
  },
  retrying: {
    title: "Still warming up",
    detail: "The free server was inactive, but we’re still connecting automatically.",
  },
  error: {
    title: "Taking longer than expected",
    detail: "We couldn’t reach the server yet. Check your connection or try again.",
  },
};

export default function ServerWakeup({ status, attempt, onRetry }) {
  const content = messages[status] || messages.connecting;

  return (
    <main className="server-wakeup" aria-live="polite" aria-busy={status !== "error"}>
      <div className="server-wakeup__glow server-wakeup__glow--one" />
      <div className="server-wakeup__glow server-wakeup__glow--two" />
      <section className="server-wakeup__card">
        <img className="server-wakeup__logo" src="/webLogo.png" alt="ClickRide" />
        <div className="server-wakeup__loader" aria-hidden="true">
          <span />
          <span />
          <span />
        </div>
        <p className="server-wakeup__eyebrow">CLICKRIDE CLOUD</p>
        <h1>{content.title}</h1>
        <p className="server-wakeup__detail">{content.detail}</p>
        {status !== "error" && (
          <div className="server-wakeup__progress">
            <span key={attempt} />
          </div>
        )}
        <p className="server-wakeup__attempt">
          {status === "error" ? "Server unavailable" : `Connection attempt ${attempt}`}
        </p>
        {status === "error" && (
          <button type="button" onClick={onRetry}>Try again</button>
        )}
      </section>
    </main>
  );
}
