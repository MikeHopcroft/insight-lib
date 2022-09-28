///////////////////////////////////////////////////////////////////////////////
//
// Nodes and Edges
//
///////////////////////////////////////////////////////////////////////////////
export type NodeType = string;
export type NodeId = string;
export type NodeFields = {[key: string]: any};
export type EdgeCollection = {[type: EdgeType]: Edge[]};

export interface Node {
  id: NodeId;
  type: NodeType;
  incoming: EdgeCollection;
  outgoing: EdgeCollection;
  fields: NodeFields;
}

export type EdgeType = string;

export interface Edge {
  type: EdgeType;
  from: Node;
  to: Node;
}

///////////////////////////////////////////////////////////////////////////////
//
// Working proposal for serialization format.
//
// DESIGN NOTE: SerilaizableId will likely have a structure like
//   `urn:is:${node.type}:${node.id}`
// where node.id, will likely be a string encoding of the service's id for
// the node.
//
///////////////////////////////////////////////////////////////////////////////
export type SerializableNodeId = string;
export type SerializableEdge = {[edgeType: string]: SerializableNodeId};

export interface SerializableNode {
  id: SerializableNodeId;
  outgoing: SerializableEdge[];
  fields: NodeFields;
}
