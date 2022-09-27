// Temporary import for create plausible fake NodeIds.
// TODO: uninstall node-murmurhash and delete node-murmurhash.d.ts
import * as murmurhash from 'node-murmurhash';

import {
  EdgeType,
  Node,
  NodeFields,
  NodeId,
  NodeType,
  SerializableEdge,
  SerializableNode,
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

  serialize(): SerializableNode[] {
    const nodes: SerializableNode[] = [];
    for (const type of this.nodes.values()) {
      for (const node of type.values()) {
        nodes.push({
          id: getNodeRef(node),
          outgoing: serializeEdges(node.outgoing),
          fields: node.fields,
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
function serializeEdges(edges: Node['outgoing']): SerializableEdge[] {
  const result: SerializableEdge[] = [];
  for (const type in edges) {
    for (const edge of edges[type]) {
      result.push({
        [edge.type]: getNodeRef(edge.to),
      });
    }
  }
  return result;
}

function getNodeRef(node: Node): string {
  // Create plausible fake NodeIds
  const hash = murmurhash(node.type + node.id, 123456);
  return `urn:is:${node.type}:${hash}`;
}
