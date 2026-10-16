export function SideSummary({ title, rows }: { title: string; rows: Array<{ label: string; value: string }> }) {
  return (
    <aside className="side-panel">
      <h3>{title}</h3>
      <dl className="summary">
        {rows.map((row) => (
          <div key={row.label}>
            <dt>{row.label}</dt>
            <dd>{row.value}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
