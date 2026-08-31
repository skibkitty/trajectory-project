import type { DependencyGraph } from "../domain/index.js";

export interface PositionedNode {
  readonly taskId: string;
  readonly x: number;
  readonly y: number;
  readonly layer: number;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly fromX: number;
  readonly fromY: number;
  readonly toX: number;
  readonly toY: number;
}

export interface GraphLayout {
  readonly nodes: readonly PositionedNode[];
  readonly edges: readonly GraphEdge[];
  readonly width: number;
  readonly height: number;
}

const NODE_WIDTH = 160;
const NODE_HEIGHT = 60;
const LAYER_SPACING = 120;
const NODE_SPACING = 40;

export function computeNodePositions(graph: DependencyGraph): PositionedNode[] {
  const topologicalOrder = graph.topologicalOrder();
  const layers = new Map<string, number>();

  for (const taskId of topologicalOrder) {
    const prereqs = graph.getPrerequisites(taskId);
    const maxLayer =
      prereqs.length === 0
        ? -1
        : Math.max(...prereqs.map((p) => layers.get(p) ?? 0));
    layers.set(taskId, maxLayer + 1);
  }

  const layerGroups = new Map<number, string[]>();
  for (const [taskId, layer] of layers) {
    const group = layerGroups.get(layer) ?? [];
    group.push(taskId);
    layerGroups.set(layer, group);
  }

  for (const group of layerGroups.values()) {
    group.sort();
  }

  const maxLayer = Math.max(...layers.values(), 0);
  const positioned: PositionedNode[] = [];

  for (let layerIdx = 0; layerIdx <= maxLayer; layerIdx++) {
    const group = layerGroups.get(layerIdx) ?? [];
    for (let i = 0; i < group.length; i++) {
      const taskId = group[i];
      positioned.push({
        taskId,
        x: layerIdx * (NODE_WIDTH + LAYER_SPACING),
        y: i * (NODE_HEIGHT + NODE_SPACING),
        layer: layerIdx,
      });
    }
  }

  return positioned;
}

export function computeEdges(
  positioned: readonly PositionedNode[],
  graph: DependencyGraph,
): GraphEdge[] {
  const nodeMap = new Map<string, PositionedNode>();
  for (const node of positioned) {
    nodeMap.set(node.taskId, node);
  }

  const edges: GraphEdge[] = [];
  for (const node of positioned) {
    const dependents = graph.getDependents(node.taskId);
    for (const depId of dependents) {
      const depNode = nodeMap.get(depId);
      if (depNode) {
        edges.push({
          from: node.taskId,
          to: depId,
          fromX: node.x + NODE_WIDTH,
          fromY: node.y + NODE_HEIGHT / 2,
          toX: depNode.x,
          toY: depNode.y + NODE_HEIGHT / 2,
        });
      }
    }
  }

  return edges;
}

export function computeLayout(graph: DependencyGraph): GraphLayout {
  const positioned = computeNodePositions(graph);
  const edges = computeEdges(positioned, graph);

  const maxX =
    positioned.length > 0
      ? Math.max(...positioned.map((n) => n.x)) + NODE_WIDTH
      : 0;
  const maxY =
    positioned.length > 0
      ? Math.max(...positioned.map((n) => n.y)) + NODE_HEIGHT
      : 0;

  return {
    nodes: positioned,
    edges,
    width: maxX + NODE_SPACING,
    height: maxY + NODE_SPACING,
  };
}

export { NODE_WIDTH, NODE_HEIGHT };
