/**
 * Planner Agent
 * Decides node execution ordering using topological sorting and emits a confidence score.
 */
class PlannerAgent {
  constructor() {
    this.name = 'planner';
  }

  plan(workflow) {
    const nodes = workflow.nodes || [];
    const edges = workflow.edges || [];

    if (nodes.length === 0) {
      return {
        executionOrder: [],
        confidenceScore: 0.0,
        error: 'Workflow contains no nodes to execute',
      };
    }

    // Build adjacency list & in-degree map
    const adj = new Map();
    const inDegree = new Map();

    nodes.forEach((n) => {
      adj.set(n.id, []);
      inDegree.set(n.id, 0);
    });

    edges.forEach((e) => {
      if (adj.has(e.source) && inDegree.has(e.target)) {
        adj.get(e.source).push(e.target);
        inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
      }
    });

    // Kahn's Algorithm for Topological Sort
    const queue = [];
    inDegree.forEach((deg, nodeId) => {
      if (deg === 0) queue.push(nodeId);
    });

    const executionOrder = [];
    while (queue.length > 0) {
      const current = queue.shift();
      executionOrder.push(current);

      const neighbors = adj.get(current) || [];
      for (const next of neighbors) {
        inDegree.set(next, inDegree.get(next) - 1);
        if (inDegree.get(next) === 0) {
          queue.push(next);
        }
      }
    }

    // Check for cycles or unvisited nodes
    const hasCycle = executionOrder.length < nodes.length;
    
    // If there is a cycle or detached components, add missing nodes gracefully
    if (hasCycle) {
      nodes.forEach((n) => {
        if (!executionOrder.includes(n.id)) {
          executionOrder.push(n.id);
        }
      });
    }

    // Calculate plan confidence score (1.0 for clean DAG, 0.75 for complex/multiple triggers)
    let confidenceScore = hasCycle ? 0.65 : 0.98;
    const triggerNodes = nodes.filter((n) => n.type === 'trigger' || n.data?.category === 'trigger');
    if (triggerNodes.length > 1) confidenceScore -= 0.08;

    return {
      executionOrder,
      confidenceScore: Math.max(0.1, Math.min(1.0, confidenceScore)),
      totalNodes: nodes.length,
      totalEdges: edges.length,
      hasCycle,
      planSummary: `Calculated sequential agentic plan with ${executionOrder.length} steps.`,
    };
  }
}

module.exports = new PlannerAgent();
