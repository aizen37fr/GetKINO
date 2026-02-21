import {
    fetchSimilar,
    fetchCredits,
    fetchByPerson,
    fetchDetails,
} from './tmdb-extended';

export type EdgeReason = 'similar' | 'actor' | 'director' | 'genre';

export interface GraphNode {
    id: string;            // "movie-123" or "tv-456"
    tmdbId: number;
    type: 'movie' | 'tv';
    label: string;
    posterPath: string | null;
    rating: number;
    year: string;
    overview: string;
    genres: string[];
    // Layout (set by force sim)
    x: number;
    y: number;
    fx?: number | null;  // pinned x
    fy?: number | null;  // pinned y
    isExpanded: boolean;
    isSeed: boolean;
}

export interface GraphEdge {
    id: string;
    source: string;  // node id
    target: string;  // node id
    reason: EdgeReason;
    label: string;   // e.g. "Similar", "Stars Tom Hanks", "Directed by Nolan"
}

export interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

const IMAGE_BASE = 'https://image.tmdb.org/t/p/w300';

function makeNodeId(tmdbId: number, type: 'movie' | 'tv') {
    return `${type}-${tmdbId}`;
}

function tmdbResultToNode(r: any, type: 'movie' | 'tv'): GraphNode {
    return {
        id: makeNodeId(r.id, type),
        tmdbId: r.id,
        type,
        label: r.title || r.name || 'Unknown',
        posterPath: r.poster_path ? `${IMAGE_BASE}${r.poster_path}` : null,
        rating: Math.round((r.vote_average || 0) * 10) / 10,
        year: (r.release_date || r.first_air_date || '').slice(0, 4),
        overview: r.overview || '',
        genres: (r.genres || []).map((g: any) => g.name),
        x: 0,
        y: 0,
        isExpanded: false,
        isSeed: false,
    };
}

/**
 * Build the initial graph from a seed TMDB title.
 * Returns the seed node + its immediate connections.
 */
export async function buildSeedGraph(
    tmdbId: number,
    type: 'movie' | 'tv',
): Promise<GraphData> {
    const nodes: Map<string, GraphNode> = new Map();
    const edges: GraphEdge[] = [];

    // 1. Fetch seed details
    const details = await fetchDetails(tmdbId, type);
    if (!details) return { nodes: [], edges: [] };

    const seedNode: GraphNode = {
        ...tmdbResultToNode(details, type),
        isSeed: true,
        isExpanded: true,
        x: 0,
        y: 0,
        fx: 0,
        fy: 0,
    };
    nodes.set(seedNode.id, seedNode);

    // 2. Fetch similar titles (up to 6)
    const similar = await fetchSimilar(tmdbId, type);
    const similarSlice = similar.filter((s: any) => s.poster_path && s.vote_average > 5).slice(0, 6);
    for (const s of similarSlice) {
        const mediaType = s.media_type === 'tv' ? 'tv' : type;
        const n = tmdbResultToNode(s, mediaType);
        if (!nodes.has(n.id)) nodes.set(n.id, n);
        edges.push({
            id: `${seedNode.id}__${n.id}__similar`,
            source: seedNode.id,
            target: n.id,
            reason: 'similar',
            label: 'Similar',
        });
    }

    // 3. Top 2 actors → their top movies
    const credits = await fetchCredits(tmdbId, type);
    const topActors = credits.cast.slice(0, 2);
    for (const actor of topActors) {
        const actorMovies = await fetchByPerson(actor.id, 'cast');
        const actorSlice = actorMovies
            .filter((m: any) => makeNodeId(m.id, m.media_type === 'tv' ? 'tv' : 'movie') !== seedNode.id)
            .slice(0, 3);
        for (const m of actorSlice) {
            const mType: 'movie' | 'tv' = m.media_type === 'tv' ? 'tv' : 'movie';
            const n = tmdbResultToNode(m, mType);
            if (!nodes.has(n.id)) nodes.set(n.id, n);
            const eid = `${seedNode.id}__${n.id}__actor`;
            if (!edges.find(e => e.id === eid)) {
                edges.push({
                    id: eid,
                    source: seedNode.id,
                    target: n.id,
                    reason: 'actor',
                    label: `Stars ${actor.name}`,
                });
            }
        }
    }

    // 4. Director → their other top movies
    const directors = credits.crew.filter((c: any) => c.job === 'Director').slice(0, 1);
    for (const dir of directors) {
        const dirMovies = await fetchByPerson(dir.id, 'crew');
        const dirSlice = dirMovies
            .filter((m: any) => makeNodeId(m.id, m.media_type === 'tv' ? 'tv' : 'movie') !== seedNode.id)
            .slice(0, 3);
        for (const m of dirSlice) {
            const mType: 'movie' | 'tv' = m.media_type === 'tv' ? 'tv' : 'movie';
            const n = tmdbResultToNode(m, mType);
            if (!nodes.has(n.id)) nodes.set(n.id, n);
            const eid = `${seedNode.id}__${n.id}__director`;
            if (!edges.find(e => e.id === eid)) {
                edges.push({
                    id: eid,
                    source: seedNode.id,
                    target: n.id,
                    reason: 'director',
                    label: `Directed by ${dir.name}`,
                });
            }
        }
    }

    return { nodes: Array.from(nodes.values()), edges };
}

/**
 * Expand an existing node — fetch its connections and merge into graph.
 */
export async function expandNode(
    nodeId: string,
    existingGraph: GraphData,
): Promise<GraphData> {
    const node = existingGraph.nodes.find(n => n.id === nodeId);
    if (!node || node.isExpanded) return existingGraph;

    const newNodes: Map<string, GraphNode> = new Map(
        existingGraph.nodes.map(n => [n.id, n])
    );
    const newEdges: GraphEdge[] = [...existingGraph.edges];

    // Mark as expanded
    const expandedNode = { ...node, isExpanded: true };
    newNodes.set(nodeId, expandedNode);

    // Fetch similar (up to 4)
    const similar = await fetchSimilar(node.tmdbId, node.type);
    const simSlice = similar.filter((s: any) => s.poster_path && s.vote_average > 5).slice(0, 4);
    for (const s of simSlice) {
        const mType = s.media_type === 'tv' ? 'tv' : node.type;
        const n = tmdbResultToNode(s, mType);
        if (!newNodes.has(n.id)) newNodes.set(n.id, n);
        const eid = `${nodeId}__${n.id}__similar`;
        if (!newEdges.find(e => e.id === eid)) {
            newEdges.push({ id: eid, source: nodeId, target: n.id, reason: 'similar', label: 'Similar' });
        }
    }

    // Fetch top actor's other work (1 actor, up to 2 results)
    const credits = await fetchCredits(node.tmdbId, node.type);
    const topActor = credits.cast[0];
    if (topActor) {
        const actorMovies = await fetchByPerson(topActor.id, 'cast');
        const actorSlice = actorMovies
            .filter((m: any) => makeNodeId(m.id, m.media_type === 'tv' ? 'tv' : 'movie') !== nodeId)
            .slice(0, 2);
        for (const m of actorSlice) {
            const mType: 'movie' | 'tv' = m.media_type === 'tv' ? 'tv' : 'movie';
            const n = tmdbResultToNode(m, mType);
            if (!newNodes.has(n.id)) newNodes.set(n.id, n);
            const eid = `${nodeId}__${n.id}__actor`;
            if (!newEdges.find(e => e.id === eid)) {
                newEdges.push({ id: eid, source: nodeId, target: n.id, reason: 'actor', label: `Stars ${topActor.name}` });
            }
        }
    }

    return {
        nodes: Array.from(newNodes.values()),
        edges: newEdges,
    };
}

export const EDGE_COLORS: Record<EdgeReason, string> = {
    similar: '#a855f7',   // purple
    actor: '#06b6d4',     // cyan
    director: '#f59e0b',  // amber
    genre: '#22c55e',     // green
};

export const EDGE_LABELS: Record<EdgeReason, string> = {
    similar: '🎬 Similar',
    actor: '🎭 Actor',
    director: '🎥 Director',
    genre: '🏷️ Genre',
};
