import type { FastifyInstance } from 'fastify';
import {
  filterGraph,
  getConnectedEdges,
  getGraphStats,
  graphQuerySchema,
} from '@aws-visualizer/shared';
import type { GraphStore } from '../store/graph-store.interface.js';
import { NotFoundError, ValidationError } from '../errors/app-error.js';

export function registerGraphRoutes(
  app: FastifyInstance,
  store: GraphStore,
): void {
  app.get('/api/graph', async (request) => {
    const graph = store.getLatestGraph();
    if (!graph) {
      throw new NotFoundError('Graph', 'latest');
    }

    const parsed = graphQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      throw new ValidationError(parsed.error.message);
    }

    const query = parsed.data;
    const filtered = filterGraph(graph, {
      resourceTypes: query.types,
      regions: query.regions,
      vpcIds: query.vpcIds,
      searchQuery: query.search,
    });

    return {
      graph: filtered,
      stats: getGraphStats(filtered),
    };
  });

  app.get<{ Params: { id: string } }>(
    '/api/graph/resource/:id',
    async (request) => {
      const graph = store.getLatestGraph();
      if (!graph) {
        throw new NotFoundError('Graph', 'latest');
      }

      const node = graph.nodes.find((n) => n.id === request.params.id);
      if (!node) {
        throw new NotFoundError('Resource', request.params.id);
      }

      const edges = getConnectedEdges(graph, node.id);

      return { node, edges };
    },
  );
}
