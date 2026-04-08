type StatusMessageProps = {
  info: string;
  error: string;
};

export function StatusMessage({ info, error }: StatusMessageProps) {
  if (!info && !error) return null;

  return (
    <div className="status-message" role="status" aria-live="polite">
      {info ? <p className="ok">{info}</p> : null}
      {error ? <p className="err">{error}</p> : null}
    </div>
  );
}
