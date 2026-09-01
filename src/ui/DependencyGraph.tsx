import { useMemo } from "react";
import type { Task } from "../domain/index.js";
import type { DependencyGraph } from "../domain/index.js";
import type { ScheduleResult } from "../domain/index.js";
import { computeLayout, NODE_WIDTH, NODE_HEIGHT } from "./graph-layout.js";

const STATUS_COLORS: Record<string, string> = {
  DONE: "#22c55e",
  IN_PROGRESS: "#3b82f6",
  TODO: "#f59e0b",
  BACKLOG: "#94a3b8",
  BLOCKED: "#ef4444",
};

export interface DependencyGraphProps {
  tasks: readonly Task[];
  graph: DependencyGraph;
  schedule: ScheduleResult;
}

export function DependencyGraphVisualization({
  tasks,
  graph,
  schedule,
}: DependencyGraphProps) {
  const layout = useMemo(() => computeLayout(graph), [graph]);

  const criticalPathSet = useMemo(() => {
    const set = new Set<string>();
    for (const taskId of schedule.criticalPath) {
      set.add(taskId);
    }
    return set;
  }, [schedule.criticalPath]);

  if (tasks.length === 0) {
    return (
      <div data-testid="dependency-graph-empty" className="empty-state">
        <h3>Dependency Graph</h3>
        <p>No tasks to visualize yet.</p>
      </div>
    );
  }

  const title = `Dependency graph with ${tasks.length} tasks. `;

  return (
    <div data-testid="dependency-graph" className="dependency-graph">
      <h3>Dependency Graph</h3>
      <svg
        role="img"
        aria-label={title}
        width={layout.width}
        height={layout.height}
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        data-testid="graph-svg"
      >
        {layout.edges.map((edge) => (
          <line
            key={`${edge.from}-${edge.to}`}
            x1={edge.fromX}
            y1={edge.fromY}
            x2={edge.toX}
            y2={edge.toY}
            stroke="#64748b"
            strokeWidth={2}
            markerEnd="url(#arrowhead)"
            data-testid="graph-edge"
          />
        ))}

        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="10"
            refY="3.5"
            orient="auto"
          >
            <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
          </marker>
        </defs>

        {layout.nodes.map((node) => {
          const isCritical = criticalPathSet.has(node.taskId);
          const task = tasks.find((t) => t.id === node.taskId);
          const status = task?.status ?? "BACKLOG";
          const fillColor = STATUS_COLORS[status] ?? "#94a3b8";

          return (
            <g
              key={node.taskId}
              data-testid={`graph-node-${node.taskId}`}
              data-critical={isCritical}
            >
              <rect
                x={node.x}
                y={node.y}
                width={NODE_WIDTH}
                height={NODE_HEIGHT}
                rx={6}
                fill={fillColor}
                stroke={isCritical ? "#000" : "#475569"}
                strokeWidth={isCritical ? 3 : 1}
                opacity={0.9}
              />
              <text
                x={node.x + 8}
                y={node.y + 20}
                fill="#fff"
                fontSize={12}
                fontWeight="bold"
              >
                {node.taskId}
              </text>
              <text x={node.x + 8} y={node.y + 36} fill="#fff" fontSize={11}>
                {(task?.title ?? "").length > 18
                  ? `${(task?.title ?? "").slice(0, 18)}…`
                  : (task?.title ?? "")}
              </text>
              <text x={node.x + 8} y={node.y + 50} fill="#e2e8f0" fontSize={10}>
                {status}
              </text>
            </g>
          );
        })}
      </svg>

      <div data-testid="graph-legend" className="graph-legend">
        <span>
          <svg width="14" height="14">
            <rect
              width="14"
              height="14"
              rx="3"
              stroke="#000"
              strokeWidth="2"
              fill="#94a3b8"
            />
          </svg>{" "}
          Critical path (bold border)
        </span>
        {Object.entries(STATUS_COLORS).map(([status, color]) => (
          <span key={status}>
            <svg width="14" height="14">
              <rect width="14" height="14" rx="3" fill={color} />
            </svg>{" "}
            {status}
          </span>
        ))}
      </div>
    </div>
  );
}
