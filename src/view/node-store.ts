import {
  EdgeType,
  Node,
  NodeTemplate,
  NodeFields,
  NodeId,
  NodeType,
} from './interfaces';

export class NodeStore {
  nodes = new Map<NodeType, Map<NodeId, Node>>();

  getNode(type: NodeType, id: NodeId): Node | undefined {
    const a = this.nodes.get(type);
    if (a) {
      return a.get(id);
    }
    return undefined;
  }

  getNodesWithType(type: NodeType): Node[] {
    const a = this.nodes.get(type);
    if (a) {
      return [...a.values()];
    }
    return [];
  }

  createNode(type: NodeType, id: NodeId, fields: NodeFields): Node {
    const node: Node = {type, id, incoming: {}, outgoing: {}, fields};
    this.addNode(node);
    return node;
  }

  createEdge(type: EdgeType, from: Node, to: Node) {
    // Add to outgoing edges to `from` node.
    let fromNodes = from.outgoing[type];
    if (!fromNodes) {
      fromNodes = [];
      from.outgoing[type] = fromNodes;
    }
    fromNodes.push({type, to, from});

    // Add to incoming edges of `to` node.
    let toNodes = to.incoming[type];
    if (!toNodes) {
      toNodes = [];
      to.incoming[type] = toNodes;
    }
    toNodes.push({type, to: from, from: to});
  }

  serialize(): NodeTemplate<string>[] {
    const nodes: NodeTemplate<string>[] = [];
    for (const type of this.nodes.values()) {
      for (const node of type.values()) {
        nodes.push({
          ...node,
          incoming: serializeEdges(node.incoming),
          outgoing: serializeEdges(node.outgoing),
        });
      }
    }

    return nodes;
  }

  private addNode(node: Node) {
    const a = this.nodes.get(node.type);
    if (a) {
      if (a.has(node.id)) {
        throw new Error(`Duplicate node (${node.type}, ${node.id})`);
      }
      a.set(node.id, node);
    } else {
      const a = new Map<NodeId, Node>([[node.id, node]]);
      this.nodes.set(node.type, a);
    }
  }
}

///////////////////////////////////////////////////////////////////////////////
//
// Serialization and Deserialization
//
///////////////////////////////////////////////////////////////////////////////
function serializeEdges(edges: Node['incoming']): NodeTemplate<string>['incoming'] {
  return Object.keys(edges).reduce((acc, type) => {
    acc[type] = edges[type].map(edge => ({
      ...edge,
      from: getNodeRef(edge.from),
      to: getNodeRef(edge.to),
    }));
    return acc;
  }, {} as NodeTemplate<string>['incoming']);
}

// DESIGN NOTE: chose ':' because it doesn't appear in the text encoding of the
// numeric `id` value. This allows us to safely extract the `id` field by
// looking for the lastIndexOf(nodeRefDelimeter). The `type` field can be any
// string value, including those containing the delimeter character.
const nodeRefDelimeter = ':';

function getNodeRef(node: Node): string {
  return node.type + nodeRefDelimeter + node.id;
}

function parseNodeRef(ref: string): {id: number; type: string} {
  const x = ref.lastIndexOf(nodeRefDelimeter);
  if (x === -1) {
    throw new Error(`Error parsing NodeRef "${ref}". Expected id field.`);
  }
  const type = ref.slice(0, x);
  const id = Number(ref.slice(x + 1));
  if (isNaN(id)) {
    throw new Error(`Error parsing NodeRef "${ref}". Id must be a number.`);
  }

  return {id, type};
}
