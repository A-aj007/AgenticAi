import { create } from 'zustand';
import api from '../services/api';
import { applyNodeChanges, applyEdgeChanges, addEdge } from '@xyflow/react';

export const useWorkflowStore = create((set, get) => ({
  workflows: [],
  activeWorkflow: null,
  nodes: [],
  edges: [],
  selectedNode: null,
  isLoading: false,
  isSaving: false,
  isGenerating: false,
  generatedPreview: null,
  error: null,

  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),

  onNodesChange: (changes) => {
    set({
      nodes: applyNodeChanges(changes, get().nodes),
    });
  },

  onEdgesChange: (changes) => {
    set({
      edges: applyEdgeChanges(changes, get().edges),
    });
  },

  onConnect: (connection) => {
    set({
      edges: addEdge({ ...connection, animated: true }, get().edges),
    });
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  addNode: (nodeData, position = { x: 250, y: 150 }) => {
    const newNode = {
      id: `node-${Date.now()}`,
      type: nodeData.type || 'integration',
      position,
      data: {
        label: nodeData.label || 'New Node',
        category: nodeData.category || 'integration',
        provider: nodeData.provider || 'slack',
        action: nodeData.action || 'post_message',
        config: nodeData.defaultConfig || {},
      },
    };

    set({
      nodes: [...get().nodes, newNode],
      selectedNode: newNode,
    });
  },

  updateNodeData: (nodeId, dataUpdates) => {
    set({
      nodes: get().nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              ...dataUpdates,
              config: {
                ...(node.data.config || {}),
                ...(dataUpdates.config || {}),
              },
            },
          };
        }
        return node;
      }),
    });

    // Also update selectedNode if it matches
    const currentSelected = get().selectedNode;
    if (currentSelected && currentSelected.id === nodeId) {
      set({
        selectedNode: {
          ...currentSelected,
          data: {
            ...currentSelected.data,
            ...dataUpdates,
            config: {
              ...(currentSelected.data.config || {}),
              ...(dataUpdates.config || {}),
            },
          },
        },
      });
    }
  },

  deleteNode: (nodeId) => {
    set({
      nodes: get().nodes.filter((n) => n.id !== nodeId),
      edges: get().edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
      selectedNode: get().selectedNode?.id === nodeId ? null : get().selectedNode,
    });
  },

  fetchWorkflows: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get('/api/workflows', { params: filters });
      set({ workflows: res.data.data, isLoading: false });
      return res.data.data;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch workflows', isLoading: false });
    }
  },

  fetchWorkflowById: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await api.get(`/api/workflows/${id}`);
      const wf = res.data.data;
      set({
        activeWorkflow: wf,
        nodes: wf.nodes || [],
        edges: wf.edges || [],
        selectedNode: null,
        isLoading: false,
      });
      return wf;
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to load workflow', isLoading: false });
      throw err;
    }
  },

  saveActiveWorkflow: async (updates = {}) => {
    const { activeWorkflow, nodes, edges } = get();
    if (!activeWorkflow?._id) return;

    set({ isSaving: true });
    try {
      const payload = {
        ...updates,
        nodes,
        edges,
      };

      const res = await api.put(`/api/workflows/${activeWorkflow._id}`, payload);
      set({ activeWorkflow: res.data.data, isSaving: false });
      return res.data.data;
    } catch (err) {
      set({ isSaving: false });
      throw err;
    }
  },

  generateFromPrompt: async (prompt) => {
    set({ isGenerating: true, error: null });
    try {
      const res = await api.post('/api/workflows/generate', { prompt });
      const generated = res.data.data;
      set({
        generatedPreview: generated,
        isGenerating: false,
      });
      return generated;
    } catch (err) {
      const msg = err.response?.data?.error || 'Workflow AI generation failed';
      set({ error: msg, isGenerating: false });
      throw new Error(msg);
    }
  },

  clearGeneratedPreview: () => set({ generatedPreview: null }),
}));
