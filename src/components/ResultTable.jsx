export default function ResultTable({ result }) {
  if (!result) return <p className="muted">(no result set)</p>
  if (result.rows.length === 0) return <p className="muted">0 rows returned.</p>

  return (
    <div className="result-table-wrap">
      <table>
        <thead>
          <tr>
            {result.columns.map((c) => (
              <th key={c}>{c}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.rows.slice(0, 50).map((row, i) => (
            <tr key={i}>
              {row.map((val, j) => (
                <td key={j}>{val === null ? <em>NULL</em> : String(val)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {result.rows.length > 50 && (
        <p className="muted">Showing first 50 of {result.rows.length} rows.</p>
      )}
    </div>
  )
}
