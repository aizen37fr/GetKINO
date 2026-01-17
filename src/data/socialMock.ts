export const USERS = [
    { id: 'u1', name: 'Ayush', avatar: 'https://i.pravatar.cc/150?u=ayush' },
    { id: 'u2', name: 'Sarah', avatar: 'https://i.pravatar.cc/150?u=sarah' },
    { id: 'u3', name: 'Mike', avatar: 'https://i.pravatar.cc/150?u=mike' },
];

export const GROUPS = [
    {
        id: 'g1',
        name: 'Weekend Movie Night',
        members: ['u1', 'u2', 'u3'],
        lastMessage: 'Mike: That movie was crazy!',
        time: '1h ago',
    },
    {
        id: 'g2',
        name: 'Anime Club',
        members: ['u1', 'u2'],
        lastMessage: 'Sarah: Have you seen the latest ep?',
        time: '3h ago',
    }
];
