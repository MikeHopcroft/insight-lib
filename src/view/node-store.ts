import {EdgeType, Node, NodeFields, NodeId, NodeType} from './interfaces';

export class Store {
  nodes = new Map<NodeType, Map<NodeId, Node>>();

  getNode(type: NodeType, id: NodeId): Node | undefined {
    const a = this.nodes.get(type);
    if (a) {
      return a.get(id);
    }
    return undefined;
  }

  getNodes(type: NodeType): Node[] {
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
    let fromNodes = from.outgoing[type];
    if (!fromNodes) {
      fromNodes = [];
      from.outgoing[type] = fromNodes;
    }
    fromNodes.push({type, node: to});

    let toNodes = to.incoming[type];
    if (!toNodes) {
      toNodes = [];
      to.incoming[type] = toNodes;
    }
    toNodes.push({type, node: from});
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
