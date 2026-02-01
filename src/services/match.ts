import type { ContentItem } from '../data/db';
import { supabase } from './supabase';

type SwipeAction = {
    type: 'swipe';
    itemId: string;
    direction: 'like' | 'nope';
    userId: string;
};

type SessionEvent = SwipeAction;

class MatchService {
    private channel: BroadcastChannel | null = null;
    private supabaseChannel: any = null; // Generic type to avoid strict dependency issues
    private sessionId: string | null = null;
    private userId: string;
    private likes: Set<string> = new Set();
    private peerLikes: Set<string> = new Set();
    private onMatchCallback: ((item: ContentItem) => void) | null = null;

    constructor() {
        this.userId = Math.random().toString(36).substring(7);
    }

    createSession(): string {
        this.sessionId = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.connect(this.sessionId);
        return this.sessionId;
    }

    joinSession(sessionId: string) {
        this.sessionId = sessionId;
        this.connect(sessionId);
    }

    private connect(sessionId: string) {
        console.log(`Connecting to session ${sessionId}...`);

        // 1. Try Supabase (Cloud)
        if (supabase) {
            console.log("Using Supabase Realtime ☁️");
            if (this.supabaseChannel) supabase.removeChannel(this.supabaseChannel);

            this.supabaseChannel = supabase.channel(`match_session_${sessionId}`)
                .on('broadcast', { event: 'swipe' }, (payload: any) => {
                    // Check if it's from another user
                    if (payload.payload.userId !== this.userId) {
                        this.handlePeerSwipe(payload.payload as SwipeAction);
                    }
                })
                .subscribe();

        } else {
            // 2. Fallback to BroadcastChannel (Local)
            console.log("Using BroadcastChannel (Local) 🏠");
            if (this.channel) this.channel.close();
            this.channel = new BroadcastChannel(`match_session_${sessionId}`);
            this.channel.onmessage = (event) => {
                const data = event.data as SessionEvent;
                if (data.type === 'swipe' && data.userId !== this.userId) {
                    this.handlePeerSwipe(data);
                }
            };
        }

        console.log(`Connected as ${this.userId}`);
    }

    sendSwipe(item: ContentItem, direction: 'like' | 'nope') {
        const payload: SwipeAction = {
            type: 'swipe',
            itemId: item.id,
            direction,
            userId: this.userId
        };

        // Update Local State
        if (direction === 'like') {
            this.likes.add(item.id);
            if (this.peerLikes.has(item.id)) {
                this.triggerMatch(item); // Instant match if we know they liked it
            }
        }

        // Send over Network
        if (supabase && this.supabaseChannel) {
            this.supabaseChannel.send({
                type: 'broadcast',
                event: 'swipe',
                payload: payload
            });
        } else if (this.channel) {
            this.channel.postMessage(payload);
        }
    }

    private handlePeerSwipe(action: SwipeAction) {
        if (action.direction === 'like') {
            this.peerLikes.add(action.itemId);
            // Check if WE already liked it
            if (this.likes.has(action.itemId)) {
                // Determine match
                // Note: ideally we need the Item object here, but we only have ID.
                // We rely on the fact that if we Liked it, we probably have the item in memory/UI.
                // For this proof-of-concept, we trigger a match event with a partial item or lookup.
                // Since this class doesn't store items, we might need to fetch it or signal UI to lookup.
                // However, 'onMatchCallback' expects an Item.
                // Workaround: We find the item in our 'likes' history? No, that's just a set of IDs.
                // Better: The UI should handle the lookup?
                // Or: We just pass a partial object.
                this.triggerMatch({
                    id: action.itemId,
                    title: "Matched Movie",
                    type: "movie",
                    moods: [],
                    genres: [],
                    language: "English",
                    rating: 0,
                    year: 2024,
                    image: "",
                    description: "Matched content"
                });
            }
        }
    }

    setMatchCallback(cb: (item: ContentItem) => void) {
        this.onMatchCallback = cb;
    }

    triggerMatch(item: ContentItem) {
        if (this.onMatchCallback) {
            this.onMatchCallback(item);
        }
    }
}

export const matchService = new MatchService();
