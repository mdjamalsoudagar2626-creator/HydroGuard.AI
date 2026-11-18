import { StatusLabel } from './StatusLabel';
import type { PipelineSegment, WaterStatus } from '../types/water';

interface PipelineSchematicProps {
  segments: PipelineSegment[];
  selectedSegmentId: string;
  onSelectSegment: (id: string) => void;
  tankLevel: number;
}

function getStrokeColor(status: WaterStatus): string {
  if (status === 'Critical') return '#DC2626';
  if (status === 'Warning') return '#D97706';
  return '#0284C7';
}

function getBgTint(status: WaterStatus): string {
  if (status === 'Critical') return '#FEF2F2';
  if (status === 'Warning') return '#FFFBEB';
  return '#F0F9FF';
}

export function PipelineSchematic({
  segments,
  selectedSegmentId,
  onSelectSegment,
  tankLevel,
}: PipelineSchematicProps) {
  const selected =
    segments.find((s) => s.id === selectedSegmentId) ?? segments[0];

  const intake = segments[0];
  const filtration = segments[1];
  const trunk = segments[2];
  const zoneA = segments[3];
  const zoneB = segments[4];

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div>
          <h3 className="font-display text-lg font-semibold text-slate-900">
            Live Hydraulic Network &amp; Pipe Stress Schematic
          </h3>
          <p className="text-sm text-slate-500">
            Click any pipeline segment below to inspect material specifications, hydraulic pressure, and estimated stress.
          </p>
        </div>
        <div className="flex items-center gap-4 text-xs text-slate-600">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-sm bg-sky-600 inline-block" />
            Safe
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-sm bg-amber-600 inline-block" />
            Warning
          </span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-3 h-1.5 rounded-sm bg-red-600 inline-block" />
            Critical
          </span>
        </div>
      </div>

      {/* Responsive Interactive SVG Pipeline Diagram */}
      <div className="w-full overflow-x-auto border border-slate-100 rounded-lg bg-slate-50/60 p-3">
        <svg
          viewBox="0 0 920 260"
          className="w-full min-w-[680px] h-auto"
          role="img"
          aria-label="Interactive smart water supply pipeline network schematic"
        >
          {/* Reservoir / Overhead Tank */}
          <g>
            <rect
              x="20"
              y="70"
              width="105"
              height="110"
              rx="8"
              fill="#FFFFFF"
              stroke="#CBD5E1"
              strokeWidth="1.5"
            />
            <rect
              x="26"
              y={174 - Math.round((tankLevel / 100) * 86)}
              width="93"
              height={Math.round((tankLevel / 100) * 86)}
              rx="4"
              fill={tankLevel <= 15 ? '#FCA5A5' : tankLevel <= 30 ? '#FCD34D' : '#BAE6FD'}
            />
            <text x="72" y="92" textAnchor="middle" className="fill-slate-700 text-[11px] font-semibold">
              Main Tank
            </text>
            <text
              x="72"
              y="144"
              textAnchor="middle"
              className="fill-slate-900 text-[16px] font-bold"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {Math.round(tankLevel)}%
            </text>
          </g>

          {/* Segment 1: Intake Line */}
          <g
            onClick={() => intake && onSelectSegment(intake.id)}
            className="cursor-pointer"
          >
            <line
              x1="125"
              y1="125"
              x2="255"
              y2="125"
              stroke={getStrokeColor(intake?.status ?? 'Safe')}
              strokeWidth={selected?.id === intake?.id ? '10' : '7'}
              strokeLinecap="round"
            />
            <rect
              x="145"
              y="72"
              width="95"
              height="38"
              rx="6"
              fill={getBgTint(intake?.status ?? 'Safe')}
              stroke={selected?.id === intake?.id ? '#0369A1' : '#CBD5E1'}
              strokeWidth={selected?.id === intake?.id ? '2' : '1'}
            />
            <text x="192" y="88" textAnchor="middle" className="fill-slate-700 text-[10px] font-semibold">
              1. Intake Pump
            </text>
            <text
              x="192"
              y="102"
              textAnchor="middle"
              className="fill-slate-900 text-[10px]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {intake?.pressureBar.toFixed(2)} bar
            </text>
          </g>

          {/* Segment 2: Filtration Unit */}
          <g
            onClick={() => filtration && onSelectSegment(filtration.id)}
            className="cursor-pointer"
          >
            <rect
              x="255"
              y="88"
              width="120"
              height="74"
              rx="8"
              fill={getBgTint(filtration?.status ?? 'Safe')}
              stroke={selected?.id === filtration?.id ? '#0369A1' : getStrokeColor(filtration?.status ?? 'Safe')}
              strokeWidth={selected?.id === filtration?.id ? '2.5' : '1.5'}
            />
            <text x="315" y="114" textAnchor="middle" className="fill-slate-800 text-[11px] font-semibold">
              2. Filtration Unit
            </text>
            <text
              x="315"
              y="133"
              textAnchor="middle"
              className="fill-slate-700 text-[10px]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {filtration?.flowLpm} L/min
            </text>
            <text
              x="315"
              y="149"
              textAnchor="middle"
              className="fill-slate-500 text-[9px]"
            >
              Stress {filtration?.stressPercent}/100
            </text>
          </g>

          {/* Segment 3: Main Trunk */}
          <g
            onClick={() => trunk && onSelectSegment(trunk.id)}
            className="cursor-pointer"
          >
            <line
              x1="375"
              y1="125"
              x2="595"
              y2="125"
              stroke={getStrokeColor(trunk?.status ?? 'Safe')}
              strokeWidth={selected?.id === trunk?.id ? '11' : '8'}
              strokeLinecap="round"
            />
            <rect
              x="420"
              y="72"
              width="130"
              height="40"
              rx="6"
              fill={getBgTint(trunk?.status ?? 'Safe')}
              stroke={selected?.id === trunk?.id ? '#0369A1' : '#CBD5E1'}
              strokeWidth={selected?.id === trunk?.id ? '2' : '1'}
            />
            <text x="485" y="88" textAnchor="middle" className="fill-slate-800 text-[10px] font-semibold">
              3. Main Trunk (HDPE)
            </text>
            <text
              x="485"
              y="103"
              textAnchor="middle"
              className="fill-slate-900 text-[10px]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {trunk?.pressureBar.toFixed(2)} bar · {trunk?.leakProbability}% leak
            </text>
          </g>

          {/* Junction Manifold */}
          <circle cx="595" cy="125" r="8" fill="#0F172A" />

          {/* Segment 4: Branch A (Upper) */}
          <g
            onClick={() => zoneA && onSelectSegment(zoneA.id)}
            className="cursor-pointer"
          >
            <path
              d="M 595 125 L 650 65 L 745 65"
              fill="none"
              stroke={getStrokeColor(zoneA?.status ?? 'Safe')}
              strokeWidth={selected?.id === zoneA?.id ? '8' : '6'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="745"
              y="34"
              width="155"
              height="62"
              rx="8"
              fill={getBgTint(zoneA?.status ?? 'Safe')}
              stroke={selected?.id === zoneA?.id ? '#0369A1' : getStrokeColor(zoneA?.status ?? 'Safe')}
              strokeWidth={selected?.id === zoneA?.id ? '2.5' : '1.5'}
            />
            <text x="822" y="56" textAnchor="middle" className="fill-slate-800 text-[11px] font-semibold">
              4. Zone A — Academic
            </text>
            <text
              x="822"
              y="73"
              textAnchor="middle"
              className="fill-slate-700 text-[10px]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {zoneA?.flowLpm} L/m · {zoneA?.pressureBar.toFixed(2)} bar
            </text>
            <text x="822" y="87" textAnchor="middle" className="fill-slate-500 text-[9px]">
              Stress {zoneA?.stressPercent}/100
            </text>
          </g>

          {/* Segment 5: Branch B (Lower) */}
          <g
            onClick={() => zoneB && onSelectSegment(zoneB.id)}
            className="cursor-pointer"
          >
            <path
              d="M 595 125 L 650 185 L 745 185"
              fill="none"
              stroke={getStrokeColor(zoneB?.status ?? 'Safe')}
              strokeWidth={selected?.id === zoneB?.id ? '8' : '6'}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <rect
              x="745"
              y="154"
              width="155"
              height="62"
              rx="8"
              fill={getBgTint(zoneB?.status ?? 'Safe')}
              stroke={selected?.id === zoneB?.id ? '#0369A1' : getStrokeColor(zoneB?.status ?? 'Safe')}
              strokeWidth={selected?.id === zoneB?.id ? '2.5' : '1.5'}
            />
            <text x="822" y="176" textAnchor="middle" className="fill-slate-800 text-[11px] font-semibold">
              5. Zone B — Hostel/Lab
            </text>
            <text
              x="822"
              y="193"
              textAnchor="middle"
              className="fill-slate-700 text-[10px]"
              style={{ fontFamily: 'JetBrains Mono, monospace' }}
            >
              {zoneB?.flowLpm} L/m · {zoneB?.pressureBar.toFixed(2)} bar
            </text>
            <text x="822" y="207" textAnchor="middle" className="fill-slate-500 text-[9px]">
              Leak est. {zoneB?.leakProbability}%
            </text>
          </g>
        </svg>
      </div>

      {/* Selected Segment Detail Strip */}
      {selected && (
        <div className="border-t border-slate-200 pt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 text-sm">
          <div className="col-span-2 sm:col-span-3 lg:col-span-2">
            <div className="text-xs text-slate-500">Selected Pipeline Segment</div>
            <div className="font-semibold text-slate-900 mt-0.5">{selected.name}</div>
            <div className="text-xs text-slate-500 mt-0.5">
              {selected.zone} · {selected.material} ({selected.diameterMm} mm)
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Flow Rate</div>
            <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
              {selected.flowLpm} L/min
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Line Pressure</div>
            <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
              {selected.pressureBar.toFixed(2)} bar
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Pipe Stress</div>
            <div className="font-mono tabular-nums font-semibold text-slate-900 mt-0.5">
              {selected.stressPercent} / 100
            </div>
          </div>
          <div>
            <div className="text-xs text-slate-500">Segment Health</div>
            <div className="mt-0.5">
              <StatusLabel status={selected.status} compact />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
