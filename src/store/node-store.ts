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
  nodesByType = new Map<NodeType, Map<NodeId, Node>>();
  nodesById = new Map<NodeId, Node>();

  getNode(id: NodeId): Node | undefined {
    return this.nodesById.get(id);
  }

  getNodesWithType(type: NodeType): Node[] {
    const a = this.nodesByType.get(type);
    if (a) {
      return [...a.values()];
    }
    return [];
  }

  createNode(type: NodeType, originalId: NodeId, fields: NodeFields): Node {
    const id = type + ':' + originalId;
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
    for (const type of this.nodesByType.values()) {
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
    const a = this.nodesByType.get(node.type);
    if (a) {
      if (a.has(node.id)) {
        throw new Error(`Duplicate node (id=${node.id})`);
      }
      a.set(node.id, node);
    } else {
      const a = new Map<NodeId, Node>([[node.id, node]]);
      this.nodesByType.set(node.type, a);
    }
    if (this.nodesById.has(node.id)) {
      throw new Error(`Duplicate node (id=${node.id})`);
    } else {
      this.nodesById.set(node.id, node);
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
  const hash = murmurhash(node.id, 123456);
  return `urn:is:${node.type}:${hash}`;
}
