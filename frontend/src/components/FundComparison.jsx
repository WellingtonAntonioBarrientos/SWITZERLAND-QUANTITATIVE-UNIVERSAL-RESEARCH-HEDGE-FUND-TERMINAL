import { useState, useMemo } from "react";
import { ArrowUpRight, ArrowDownRight, Scale } from "lucide-react";

export const FundComparison = ({ filings, isBloomberg }) => {
  const [fundAId, setFundAId] = useState(filings[0]?.id);
  const [fundBId, setFundBId] = useState(filings[1]?.id);

  const fundA = filings.find(f => f.id === fundAId);
  const fundB = filings.find(f => f.id === fundBId);

  const { overlap, uniqueA, uniqueB } = useMemo(() => {
    if (!fundA || !fundB) return { overlap: [], uniqueA: [], uniqueB: [] };
    const mapA = Object.fromEntries(fundA.top_holdings.map(h => [h.symbol, h]));
    const mapB = Object.fromEntries(fundB.top_holdings.map(h => [h.symbol, h]));
    const overlap = fundA.top_holdings
      .filter(h => mapB[h.symbol])
      .map(h => ({ symbol: h.symbol, name: h.name, pctA: h.percent, pctB: mapB[h.symbol].percent }))
      .sort((a, b) => (b.pctA + b.pctB) - (a.pctA + a.pctB))
      .slice(0, 12);
    const uniqueA = fundA.top_holdings.filter(h => !mapB[h.symbol]).sort((a, b) => b.percent - a.percent).slice(0, 5);
    const uniqueB = fundB.top_holdings.filter(h => !mapA[h.symbol]).sort((a, b) => b.percent - a.percent).slice(0, 5);
    return { overlap, uniqueA, uniqueB };
  }, [fundA, fundB]);

  if (!fundA || !fundB) return null;

  const fmtAum = (v) => v >= 1e12 ? `$${(v / 1e12).toFixed(2)}T` : `$${(v / 1e9).toFixed(1)}B`;
  const accent = isBloomberg ? 'text-[#ff6600]' : 'text-[#3b82f6]';

  const StatBlock = ({ fund, testid }) => (
    <div className="flex-1 p-4 bg-[#0a0a0a] border border-[#27272a] rounded" data-testid={testid}>
      <div className={`text-sm font-semibold mb-3 ${accent}`}>{fund.fund_name}</div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div><div className="text-[#71717a]">AUM</div><div className="text-[#ededed] font-mono text-base">{fmtAum(fund.aum)}</div></div>
        <div><div className="text-[#71717a]">QoQ Change</div>
          <div className={`font-mono text-base flex items-center gap-1 ${fund.quarterly_change >= 0 ? 'text-[#00e676]' : 'text-[#ef4444]'}`}>
            {fund.quarterly_change >= 0 ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}{fund.quarterly_change}%
          </div></div>
        <div><div className="text-[#71717a]">Holdings</div><div className="text-[#ededed] font-mono">{fund.top_holdings.length}</div></div>
        <div><div className="text-[#71717a]">Top Position</div><div className="text-[#ededed] font-mono">{fund.top_holdings[0]?.symbol} ({fund.top_holdings[0]?.percent.toFixed(1)}%)</div></div>
      </div>
    </div>
  );

  const selectCls = "bg-[#0a0a0a] border border-[#27272a] rounded-sm text-xs text-[#ededed] px-2 py-1.5 font-mono focus:outline-none cursor-pointer flex-1";

  return (
    <div className={`quant-card mb-4 ${isBloomberg ? 'bg-[#000] border-[#ff6600]/30' : ''}`} data-testid="fund-comparison-panel">
      <div className={`quant-card-header flex items-center gap-2 ${isBloomberg ? 'bg-[#ff6600] text-black' : ''}`}>
        <Scale size={14} /> FUND COMPARISON
      </div>
      <div className="p-4 space-y-4">
        <div className="flex gap-3">
          <select value={fundAId} onChange={e => setFundAId(e.target.value)} className={selectCls} data-testid="compare-fund-a">
            {filings.map(f => <option key={f.id} value={f.id} disabled={f.id === fundBId}>{f.fund_name}</option>)}
          </select>
          <span className="text-[#71717a] text-xs self-center">VS</span>
          <select value={fundBId} onChange={e => setFundBId(e.target.value)} className={selectCls} data-testid="compare-fund-b">
            {filings.map(f => <option key={f.id} value={f.id} disabled={f.id === fundAId}>{f.fund_name}</option>)}
          </select>
        </div>

        <div className="flex gap-3">
          <StatBlock fund={fundA} testid="compare-stats-a" />
          <StatBlock fund={fundB} testid="compare-stats-b" />
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-2">Overlapping Holdings ({overlap.length} shown)</div>
          <table className="w-full text-xs" data-testid="compare-overlap-table">
            <thead>
              <tr className="text-[#71717a] text-left border-b border-[#27272a]">
                <th className="py-1.5">SYMBOL</th><th>NAME</th>
                <th className="text-right">{fundA.fund_name.split(' ')[0].toUpperCase()} %</th>
                <th className="text-right">{fundB.fund_name.split(' ')[0].toUpperCase()} %</th>
                <th className="text-right">DIFF</th>
              </tr>
            </thead>
            <tbody>
              {overlap.map(h => (
                <tr key={h.symbol} className="border-b border-[#27272a]/50">
                  <td className={`py-1.5 font-mono ${accent}`}>{h.symbol}</td>
                  <td className="text-[#a1a1aa]">{h.name}</td>
                  <td className="text-right font-mono">{h.pctA.toFixed(2)}%</td>
                  <td className="text-right font-mono">{h.pctB.toFixed(2)}%</td>
                  <td className={`text-right font-mono ${h.pctA - h.pctB >= 0 ? 'text-[#00e676]' : 'text-[#ef4444]'}`}>
                    {(h.pctA - h.pctB) >= 0 ? '+' : ''}{(h.pctA - h.pctB).toFixed(2)}%
                  </td>
                </tr>
              ))}
              {overlap.length === 0 && <tr><td colSpan={5} className="py-3 text-center text-[#71717a]">No overlapping holdings</td></tr>}
            </tbody>
          </table>
        </div>

        <div className="flex gap-3">
          {[{ fund: fundA, unique: uniqueA, testid: "compare-unique-a" }, { fund: fundB, unique: uniqueB, testid: "compare-unique-b" }].map(({ fund, unique, testid }) => (
            <div key={testid} className="flex-1" data-testid={testid}>
              <div className="text-[10px] uppercase tracking-wider text-[#71717a] mb-2">Divergent Bets — only {fund.fund_name.split(' ')[0]}</div>
              <div className="space-y-1">
                {unique.map(h => (
                  <div key={h.symbol} className="flex justify-between text-xs p-1.5 bg-[#0a0a0a] border border-[#27272a] rounded-sm">
                    <span className={`font-mono ${accent}`}>{h.symbol}</span>
                    <span className="text-[#a1a1aa] truncate px-2">{h.name}</span>
                    <span className="font-mono">{h.percent.toFixed(2)}%</span>
                  </div>
                ))}
                {unique.length === 0 && <div className="text-xs text-[#71717a] p-1.5">None — identical universe</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
