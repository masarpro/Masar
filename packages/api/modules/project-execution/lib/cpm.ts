/**
 * Critical Path Method (CPM) Algorithm
 *
 * Pure TypeScript implementation for schedule analysis.
 * Input: nodes (activities with duration) and edges (dependencies with type/lag)
 * Output: per-node ES, EF, LS, LF, Total Float, and isCritical flag
 */

export interface CPMNode {
	id: string;
	duration: number;
}

export interface CPMEdge {
	predecessorId: string;
	successorId: string;
	type: "FINISH_TO_START" | "START_TO_START" | "FINISH_TO_FINISH" | "START_TO_FINISH";
	lag: number;
}

export interface CPMResult {
	id: string;
	ES: number; // Early Start
	EF: number; // Early Finish
	LS: number; // Late Start
	LF: number; // Late Finish
	TF: number; // Total Float
	isCritical: boolean;
}

export function calculateCPM(
	nodes: CPMNode[],
	edges: CPMEdge[],
): CPMResult[] {
	if (nodes.length === 0) return [];

	const nodeMap = new Map<string, CPMNode>();
	for (const node of nodes) {
		nodeMap.set(node.id, node);
	}

	// Build adjacency lists
	const successors = new Map<string, CPMEdge[]>();
	const predecessors = new Map<string, CPMEdge[]>();
	const inDegree = new Map<string, number>();

	for (const node of nodes) {
		successors.set(node.id, []);
		predecessors.set(node.id, []);
		inDegree.set(node.id, 0);
	}

	for (const edge of edges) {
		if (!nodeMap.has(edge.predecessorId) || !nodeMap.has(edge.successorId))
			continue;
		successors.get(edge.predecessorId)!.push(edge);
		predecessors.get(edge.successorId)!.push(edge);
		inDegree.set(edge.successorId, (inDegree.get(edge.successorId) ?? 0) + 1);
	}

	// Topological sort (Kahn's algorithm)
	const topoOrder: string[] = [];
	const queue: string[] = [];

	for (const node of nodes) {
		if ((inDegree.get(node.id) ?? 0) === 0) {
			queue.push(node.id);
		}
	}

	while (queue.length > 0) {
		const nodeId = queue.shift()!;
		topoOrder.push(nodeId);

		for (const edge of successors.get(nodeId) ?? []) {
			const newDegree = (inDegree.get(edge.successorId) ?? 1) - 1;
			inDegree.set(edge.successorId, newDegree);
			if (newDegree === 0) {
				queue.push(edge.successorId);
			}
		}
	}

	// If we couldn't process all nodes, there's a cycle
	if (topoOrder.length !== nodes.length) {
		// Return all nodes with zero values (cycle detected)
		return nodes.map((n) => ({
			id: n.id,
			ES: 0,
			EF: n.duration,
			LS: 0,
			LF: n.duration,
			TF: 0,
			isCritical: false,
		}));
	}

	// Forward pass: Calculate ES and EF
	const ES = new Map<string, number>();
	const EF = new Map<string, number>();

	for (const nodeId of topoOrder) {
		const node = nodeMap.get(nodeId)!;
		let earlyStart = 0;

		for (const edge of predecessors.get(nodeId) ?? []) {
			const predNode = nodeMap.get(edge.predecessorId)!;
			let constraint = 0;

			switch (edge.type) {
				case "FINISH_TO_START":
					constraint = (EF.get(edge.predecessorId) ?? 0) + edge.lag;
					break;
				case "START_TO_START":
					constraint = (ES.get(edge.predecessorId) ?? 0) + edge.lag;
					break;
				case "FINISH_TO_FINISH":
					constraint =
						(EF.get(edge.predecessorId) ?? 0) +
						edge.lag -
						node.duration;
					break;
				case "START_TO_FINISH":
					constraint =
						(ES.get(edge.predecessorId) ?? 0) +
						edge.lag -
						node.duration;
					break;
			}

			earlyStart = Math.max(earlyStart, constraint);
		}

		ES.set(nodeId, earlyStart);
		EF.set(nodeId, earlyStart + node.duration);
	}

	// Find project duration (max EF)
	let projectDuration = 0;
	for (const nodeId of topoOrder) {
		projectDuration = Math.max(projectDuration, EF.get(nodeId) ?? 0);
	}

	// Backward pass: Calculate LS and LF
	const LS = new Map<string, number>();
	const LF = new Map<string, number>();

	// Initialize all LF to project duration
	for (const nodeId of topoOrder) {
		LF.set(nodeId, projectDuration);
	}

	// Process in reverse topological order
	for (let i = topoOrder.length - 1; i >= 0; i--) {
		const nodeId = topoOrder[i];
		const node = nodeMap.get(nodeId)!;
		let lateFinish = projectDuration;

		for (const edge of successors.get(nodeId) ?? []) {
			const succNode = nodeMap.get(edge.successorId)!;
			let constraint = projectDuration;

			switch (edge.type) {
				case "FINISH_TO_START":
					constraint = (LS.get(edge.successorId) ?? projectDuration) - edge.lag;
					break;
				case "START_TO_START":
					constraint =
						(LS.get(edge.successorId) ?? projectDuration) -
						edge.lag +
						node.duration;
					break;
				case "FINISH_TO_FINISH":
					constraint =
						(LF.get(edge.successorId) ?? projectDuration) - edge.lag;
					break;
				case "START_TO_FINISH":
					constraint =
						(LF.get(edge.successorId) ?? projectDuration) -
						edge.lag +
						node.duration;
					break;
			}

			lateFinish = Math.min(lateFinish, constraint);
		}

		LF.set(nodeId, lateFinish);
		LS.set(nodeId, lateFinish - node.duration);
	}

	// Calculate results
	return topoOrder.map((nodeId) => {
		const es = ES.get(nodeId) ?? 0;
		const ef = EF.get(nodeId) ?? 0;
		const ls = LS.get(nodeId) ?? 0;
		const lf = LF.get(nodeId) ?? 0;
		const tf = ls - es;

		return {
			id: nodeId,
			ES: es,
			EF: ef,
			LS: ls,
			LF: lf,
			TF: tf,
			isCritical: Math.abs(tf) < 0.001, // Float tolerance
		};
	});
}
